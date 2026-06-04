import { storage } from './storage';
import { STORAGE_KEYS } from './constants';
import { db } from './firebaseConfig';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

/**
 * Collection name mapping: localStorage key → Firestore collection
 * This is the SINGLE SOURCE OF TRUTH for all sync routing.
 */
const COLLECTION_MAP = {
  [STORAGE_KEYS.PHCS]: 'phcs',
  [STORAGE_KEYS.SUB_CENTERS]: 'sub_centers',
  [STORAGE_KEYS.VILLAGES]: 'villages',
  [STORAGE_KEYS.MEMBERS]: 'members',
  [STORAGE_KEYS.FAMILIES]: 'families',
  [STORAGE_KEYS.USERS]: 'users',
  [STORAGE_KEYS.VITAL_EVENTS]: 'vital_events',
  [STORAGE_KEYS.VHND_SESSIONS]: 'vhnd_sessions',
  [STORAGE_KEYS.LOCKED_PERIODS]: 'locked_periods',
  [STORAGE_KEYS.APP_CONFIG]: 'app_config',
  [STORAGE_KEYS.TASKS]: 'tasks',
  [STORAGE_KEYS.CLAIMS]: 'claims',
  [STORAGE_KEYS.TASK_COMPLETIONS]: 'task_completions',
  // Fallbacks for direct string usage
  'tasks': 'tasks',
  'claims': 'claims',
  'task_completions': 'task_completions',
};

/**
 * Keys that must NEVER be synced to Firestore
 */
const INTERNAL_KEYS = new Set([
  STORAGE_KEYS.SYNC_QUEUE,
  STORAGE_KEYS.DELETED_IDS,
  'app_version',
]);

function getFirestoreCollectionName(storageKey) {
  if (INTERNAL_KEYS.has(storageKey)) return null;
  const mapped = COLLECTION_MAP[storageKey];
  if (!mapped) {
    console.warn(`⚠️ CloudSync: No mapping for key "${storageKey}" — skipping`);
    return null;
  }
  return mapped;
}

export const cloudSyncManager = {
  isSyncing: false,

  /**
   * Push local sync queue to Firestore
   */
  startBackgroundSync: async () => {
    if (cloudSyncManager.isSyncing) {
      console.log('🔒 CloudSync: Already syncing, skipping.');
      return { success: false, message: 'Sync already in progress' };
    }

    if (!db) {
      console.warn('❌ CloudSync: Firebase DB not initialized.');
      return { success: false, message: 'Firebase not initialized' };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('📡 CloudSync: Device is offline.');
      return { success: false, message: 'Offline' };
    }

    cloudSyncManager.isSyncing = true;
    const startTime = Date.now();

    try {
      const queue = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
      if (!queue || queue.length === 0) {
        console.log('✅ CloudSync: Queue empty, nothing to push.');
        cloudSyncManager.isSyncing = false;
        return { success: true, syncedCount: 0 };
      }

      console.log(`🚀 CloudSync: Pushing ${queue.length} items...`);

      const remainingQueue = [];
      let syncedCount = 0;
      let skippedCount = 0;
      let firstError = null;

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        try {
          // PERF-01 FIX: Only apply backoff to items that have already been attempted
          // New items (no lastAttemptAt) should always be processed immediately
          const now = Date.now();
          const lastAttempt = item.lastAttemptAt || 0;
          const isRetry = item.retryCount > 0;
          if (isRetry && now - lastAttempt < 300000) { // 5 minute backoff only for retries
            remainingQueue.push(item);
            continue;
          }
          const storageKey = item.tableName;
          const { payload, timestamp, type } = item;

          if (!storageKey || !payload) {
            console.warn(`⚠️ CloudSync [${i}]: Missing key/payload — skipping`);
            skippedCount++;
            continue;
          }

          const collectionName = getFirestoreCollectionName(storageKey);
          if (!collectionName) {
            console.log(`⏭️ CloudSync [${i}]: Skipping internal/unmapped key "${storageKey}"`);
            skippedCount++;
            continue;
          }

          const docId = payload.id ? payload.id.toString() : null;
          if (!docId) {
            console.warn(`⚠️ CloudSync [${i}]: No document ID for ${collectionName} — skipping`);
            skippedCount++;
            continue;
          }

          console.log(`📤 CloudSync [${i}]: ${type || 'save'} → ${collectionName}/${docId}`);

          // RUTHLESS FIX: Atomic Sync Item Processing with Server-Side Clock Truth
          // (serverTimestamp is imported at the top)
          
          const syncPromise = (async () => {
            if (type === 'delete') {
              await setDoc(doc(db, collectionName, docId), {
                deleted: true,
                _deletedAt: serverTimestamp(), // Use Server Time
                _lastSyncedAt: serverTimestamp(),
              }, { merge: true });
            } else {
              // RUTHLESS FIX: PII Log Redaction
              // DO NOT log 'payload' as it contains sensitive medical PII
              console.log(`📤 CloudSync [${i}]: Saving ${collectionName}/${docId} [REDACTED]`);
              
              await setDoc(doc(db, collectionName, docId), {
                ...payload,
                _lastSyncedAt: serverTimestamp(),
                _originalTimestamp: timestamp, // Keep client-time for local sorting
              }, { merge: true });
            }
          })();

          // Individual item timeout (10s) ensures the queue keeps moving
          await Promise.race([
            syncPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Item Timeout: ${collectionName}/${docId}`)), 10000)
            ),
          ]);

          // Update local record to 'synced'
          try {
            const localRecords = await storage.getAll(storageKey);
            const idx = localRecords.findIndex(r => r.id === docId);
            if (idx >= 0) {
              localRecords[idx].syncStatus = 'synced';
              localRecords[idx]._lastSyncedAt = new Date().toISOString();
              await storage.saveAll(storageKey, localRecords);
            }
          } catch (updateErr) {
            console.warn(`⚠️ CloudSync: Could not update local status for ${docId}`);
          }

          syncedCount++;
        } catch (err) {
          console.error(`❌ CloudSync [${i}]: FAILED —`, err.message);
          if (!firstError) firstError = err.message;
          
          // RUTHLESS FIX: Auth-Aware Sync Error Handling
          if (err.message?.includes('permission-denied') || err.message?.includes('unauthenticated')) {
             console.error('🛑 CRITICAL: Session expired. Background sync halted.');
             return { success: false, message: 'AUTH_EXPIRED', error: err.message };
          }
          
          // RUTHLESS FIX: Dead Letter Queue (Max 5 Retries)
          const retryCount = (item.retryCount || 0) + 1;
          const updatedItem = { ...item, retryCount, lastAttemptAt: Date.now() };
          
          if (retryCount < 5) {
            // Move failed items to the END of the queue to prevent blocking
            remainingQueue.push(updatedItem);
          } else {
            // RUTHLESS FIX: Persistent DLQ (Never discard clinical data)
            console.error(`💀 CloudSync: Moving ${docId} to Persistent DLQ after 5 failures.`);
            try {
              const dlq = await storage.getAll('dlq_forensics') || [];
              await storage.saveAll('dlq_forensics', [...dlq, { ...item, failedAt: new Date().toISOString(), error: err.message }]);
            } catch (dlqErr) {
              console.error('🚫 Critical: Could not save to DLQ table.');
            }
          }
        }
      }

      // BUG-SYNC-01 FIX: Use item.id (unique) for dedup instead of timestamp
      // which could collide when items are created in the same millisecond.
      const processedItemIds = new Set(
        queue
          .filter(item => !remainingQueue.includes(item))
          .map(item => item.id)
      );
      
      const finalQueue = latestQueue.filter(item => !processedItemIds.has(item.id));
      await storage.saveAll(STORAGE_KEYS.SYNC_QUEUE, finalQueue);

      const elapsed = Date.now() - startTime;
      console.log(`✅ CloudSync: Push done in ${elapsed}ms — synced:${syncedCount} failed:${remainingQueue.length} skipped:${skippedCount}`);

      return {
        success: syncedCount > 0 || queue.length === 0,
        syncedCount,
        failedCount: remainingQueue.length,
        error: firstError,
      };
    } catch (e) {
      console.error('💥 CloudSync: Critical push error:', e);
      return { success: false, error: e.message };
    } finally {
      cloudSyncManager.isSyncing = false;
    }
  },

  /**
   * Pull data from Firestore and merge into local storage
   * SECURITY: Enforces jurisdictional isolation via Firestore queries
   */
  pullFromCloud: async (user = null) => {
    if (!db) {
      console.warn('❌ CloudSync: Missing DB for pull.');
      return { success: false, message: 'DB not initialized' };
    }

    const startTime = Date.now();
    console.log('⬇️ CloudSync: Starting Shadow Pull...');

    try {
      const collectionsToPull = [
        { key: STORAGE_KEYS.PHCS, table: 'phcs' },
        { key: STORAGE_KEYS.SUB_CENTERS, table: 'sub_centers' },
        { key: STORAGE_KEYS.VILLAGES, table: 'villages' },
        { key: STORAGE_KEYS.MEMBERS, table: 'members' },
        { key: STORAGE_KEYS.FAMILIES, table: 'families' },
        { key: STORAGE_KEYS.USERS, table: 'users' },
        { key: STORAGE_KEYS.VITAL_EVENTS, table: 'vital_events' },
        { key: STORAGE_KEYS.VHND_SESSIONS, table: 'vhnd_sessions' },
        { key: STORAGE_KEYS.TASKS, table: 'tasks' },
        { key: STORAGE_KEYS.CLAIMS, table: 'claims' },
        { key: STORAGE_KEYS.TASK_COMPLETIONS, table: 'task_completions' },
        { key: STORAGE_KEYS.LOCKED_PERIODS, table: 'locked_periods' },
        { key: STORAGE_KEYS.APP_CONFIG, table: 'app_config' },
      ];

      // RUTHLESS FIX: Shadow Sync (Fetch WITHOUT locking UI)
      const shadowBuffer = {};
      const deletedBuffer = {};

      for (const col of collectionsToPull) {
        try {
          // JURISDICTIONAL SECURITY
          let q = collection(db, col.table);
          if (['members', 'families', 'vital_events', 'claims', 'vhnd_sessions'].includes(col.table)) {
            if (!user) {
              console.log(`🛡️ Security: Skipping clinical table ${col.table} for unauthenticated pull.`);
              continue; // Skip clinical data if no user is logged in
            }

            switch (user.role) {
              case 'ASHA': {
                // BUG-SYNC-ASHA: Fetch by BOTH villageId (Excel-imported data) AND ashaId
                // (user-registered data). We run two queries and merge to avoid missing records.
                const assignedVillageIds = [];
                const rawAssigned = user.assignedVillages || [];
                rawAssigned.forEach(v => {
                  if (typeof v === 'string' && v) assignedVillageIds.push(v);
                  else if (v && typeof v === 'object') {
                    const id = v.id || v.villageId;
                    if (id) assignedVillageIds.push(id);
                  }
                });
                if (user.villageId) assignedVillageIds.push(user.villageId);
                const uniqueVillageIds = [...new Set(assignedVillageIds)].slice(0, 10);

                if (uniqueVillageIds.length > 0) {
                  // Primary query: by villageId (for admin-imported / Excel data)
                  q = query(collection(db, col.table), where('villageId', 'in', uniqueVillageIds));
                  // Secondary query: by ashaId (for ASHA-registered data)
                  const qByAsha = query(collection(db, col.table), where('ashaId', '==', user.id));
                  // Merge both queries into the shadow buffer below
                  col._extraQuery = qByAsha;
                } else {
                  // Fallback: only pull by ashaId
                  q = query(collection(db, col.table), where('ashaId', '==', user.id || 'FORCE_BLOCK'));
                }
                break;
              }
              case 'ANM':
              case 'MPW':
              case 'CHO':
                q = query(q, where("subCenterId", "==", user.subCenterId || 'FORCE_BLOCK'));
                break;
              case 'MO':
                q = query(q, where("phcId", "==", user.phcId || 'FORCE_BLOCK'));
                break;
              case 'Admin':
                // Admin pulls everything for these tables
                break;
              default:
                // FORCE BLOCK: Unauthorized role access
                q = query(q, where("villageId", "==", "UNAUTHORIZED_ROLE_BLOCK"));
                console.error(`🛡️ Security: Blocked unauthorized data pull for role: ${user.role}`);
            }
          }

          const querySnapshot = await getDocs(q);
          const cloudData = [];
          const deletedInCloud = [];
          const seenIds = new Set();

          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            seenIds.add(docSnap.id);
            if (data.deleted === true) deletedInCloud.push(docSnap.id);
            else cloudData.push({ id: docSnap.id, ...data });
          });

          // BUG-SYNC-ASHA: Execute secondary ashaId query and merge (dedup by id)
          if (col._extraQuery) {
            try {
              const extraSnapshot = await getDocs(col._extraQuery);
              extraSnapshot.forEach((docSnap) => {
                if (seenIds.has(docSnap.id)) return; // already included
                const data = docSnap.data();
                seenIds.add(docSnap.id);
                if (data.deleted === true) deletedInCloud.push(docSnap.id);
                else cloudData.push({ id: docSnap.id, ...data });
              });
            } catch (extraErr) {
              console.warn(`⚠️ ShadowPull [${col.table}] ashaId query failed:`, extraErr.message);
            }
            delete col._extraQuery; // clean up
          }

          shadowBuffer[col.key] = cloudData;
          deletedBuffer[col.key] = deletedInCloud;
        } catch (colErr) {
          console.error(`⚠️ ShadowPull [${col.table}] failed:`, colErr.message);
        }
      }

      // NOW acquire the lock and merge lightning fast
      return await storage.withLock(async () => {
        let totalPulled = 0;
        let totalDeleted = 0;
        const tombstones = (await storage.getAll(STORAGE_KEYS.DELETED_IDS)) || [];

        for (const [storageKey, cloudData] of Object.entries(shadowBuffer)) {
          const deletedInCloud = deletedBuffer[storageKey] || [];
          const localData = await storage.getAll(storageKey);
          let merged = [...localData];

          cloudData.forEach((cd) => {
            const idx = merged.findIndex((ld) => ld.id === cd.id);
            if (idx >= 0) {
              const localItem = merged[idx];
              
              // Normalize cloud time (Handle Firestore Timestamp objects)
              const rawCloudTime = cd.lastUpdatedAt || cd._lastSyncedAt || 0;
              const cloudTime = (rawCloudTime && typeof rawCloudTime.toMillis === 'function') 
                ? rawCloudTime.toMillis() 
                : new Date(rawCloudTime || 0).getTime();
              
              const localTime = localItem.lastUpdatedAt || 0;
              const isFutureLocked = localTime > (Date.now() + 86400000);

              if (isFutureLocked) {
                merged[idx] = { ...cd, syncStatus: 'synced' };
              } else if (localItem.syncStatus !== 'pending' || cloudTime > localTime) {
                merged[idx] = { ...localItem, ...cd, syncStatus: 'synced' };
              }
            } else if (!tombstones.includes(cd.id)) {
              merged.push({ ...cd, syncStatus: 'synced' });
            }
          });

          if (deletedInCloud.length > 0) {
            merged = merged.filter((m) => !deletedInCloud.includes(m.id));
            totalDeleted += deletedInCloud.length;
          }

          await storage._saveAll(storageKey, merged);
          totalPulled += cloudData.length;
        }

        // P2-D: Call storage.recomputeSummary() after merge completes
        await storage.recomputeSummary();

        const elapsed = Date.now() - startTime;
        console.log(`✅ CloudSync: Shadow Pull merged in ${elapsed}ms — pulled:${totalPulled} removed:${totalDeleted}`);
        return { success: true, pulledCount: totalPulled, deletedCount: totalDeleted };
      });

    } catch (e) {
      console.error('💥 CloudSync: Critical pull error:', e);
      return { success: false, message: e.message };
    }
  },

  /**
   * Diagnostic: Dump current sync state to console
   */
  debugStatus: async () => {
    console.log('=== 🔍 SYNC DEBUG STATUS ===');
    console.log('isSyncing:', cloudSyncManager.isSyncing);
    console.log('Firebase DB:', db ? '✅ Connected' : '❌ Not initialized');
    console.log('Online:', typeof navigator !== 'undefined' ? navigator.onLine : 'unknown');

    const queue = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
    console.log(`Sync Queue: ${queue.length} items`);
    queue.forEach((item, i) => {
      console.log(`  [${i}] ${item.type || 'save'} → ${item.tableName} (id: ${item.payload?.id})`);
    });

    const tombstones = await storage.getAll(STORAGE_KEYS.DELETED_IDS);
    console.log(`Tombstones: ${tombstones.length} IDs`);

    for (const [key, label] of Object.entries(COLLECTION_MAP)) {
      if (INTERNAL_KEYS.has(key)) continue;
      try {
        const data = await storage.getAll(key);
        if (Array.isArray(data)) {
          const pending = data.filter((d) => d.syncStatus === 'pending').length;
          console.log(`  ${label}: ${data.length} total (${pending} pending)`);
        }
      } catch (e) { /* skip */ }
    }
    console.log('=== END DEBUG ===');
  },
};
