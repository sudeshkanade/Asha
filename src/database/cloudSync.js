import { storage } from './storage';
import { STORAGE_KEYS } from './constants';
import { db } from './firebaseConfig';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp, limit, orderBy } from 'firebase/firestore';

// Minimum time (ms) between full cloud pulls to prevent Firestore quota exhaustion.
// 15 minutes is a safe floor for rural health data that doesn't change by the second.
const PULL_COOLDOWN_MS = 15 * 60 * 1000;

// Static reference collections that rarely change — only pull once per session,
// not on every periodic refresh, to save significant read quota.
const STATIC_COLLECTIONS = new Set(['phcs', 'sub_centers', 'app_config', 'locked_periods']);

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
  // DATA-3 FIX: Add missing collections that were never syncing to Firestore
  [STORAGE_KEYS.STOCK]: 'stock',
  'governance_logs': 'governance_logs',
  'dlq_forensics': 'dlq_forensics',
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
   * Disaster Recovery: Scan all local tables for any records that were never
   * successfully synced to the cloud (status !== 'synced') and forcefully
   * inject them back into the sync queue.
   */
  recoverUnsyncedData: async () => {
    console.log('🚑 CloudSync: Starting disaster recovery scan for unsynced data...');
    let recoveredCount = 0;
    const currentQueue = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE) || [];
    const inQueueIds = new Set(currentQueue.map(q => q.payload?.id || q.id));

    const collectionsToCheck = [
      { key: STORAGE_KEYS.MEMBERS, table: 'members' },
      { key: STORAGE_KEYS.FAMILIES, table: 'families' },
      { key: STORAGE_KEYS.VITAL_EVENTS, table: 'vital_events' },
      { key: STORAGE_KEYS.VHND_SESSIONS, table: 'vhnd_sessions' },
      { key: STORAGE_KEYS.TASKS, table: 'tasks' },
      { key: STORAGE_KEYS.TASK_COMPLETIONS, table: 'task_completions' },
    ];

    for (const col of collectionsToCheck) {
      try {
        const records = await storage.getAll(col.key);
        for (const record of records) {
          if (record.syncStatus !== 'synced' && !inQueueIds.has(record.id)) {
            currentQueue.push({
              id: storage.generateId('sync_recover'),
              tableName: col.key,
              payload: record,
              timestamp: record.lastUpdatedAt || Date.now(),
              type: 'save',
              retryCount: 0,
              isRecovery: true
            });
            inQueueIds.add(record.id);
            recoveredCount++;
          }
        }
      } catch (e) {
        console.error(`⚠️ Recovery failed for ${col.table}:`, e.message);
      }
    }

    if (recoveredCount > 0) {
      await storage.saveAll(STORAGE_KEYS.SYNC_QUEUE, currentQueue);
      console.log(`✅ CloudSync: Recovered ${recoveredCount} unsynced records and added them to queue!`);
    } else {
      console.log('✅ CloudSync: No orphaned unsynced records found.');
    }
    return recoveredCount;
  },

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
          // SYNC-7 FIX: Use exponential backoff based on per-item backoffMs, not a fixed 5 minutes
          const now = Date.now();
          const lastAttempt = item.lastAttemptAt || 0;
          const isRetry = item.retryCount > 0;
          const backoffMs = item.backoffMs || 300000; // default 5 min if not set
          if (isRetry && now - lastAttempt < backoffMs) {
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
             // SYNC-1 FIX: Save the remaining queue (unprocessed items) before exiting
             // so no clinical data is abandoned on auth failure.
             const unprocessedItems = queue.slice(i + 1);
             const allRetryItems = [...remainingQueue, ...unprocessedItems];
             const latestQueueOnAuthFail = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
             const processedSoFar = new Set(queue.slice(0, i).map(qi => qi.id));
             const safeQueue = [
               ...latestQueueOnAuthFail.filter(qi => !processedSoFar.has(qi.id) || allRetryItems.some(r => r.id === qi.id)),
               ...allRetryItems.filter(r => !latestQueueOnAuthFail.some(qi => qi.id === r.id))
             ];
             await storage.saveAll(STORAGE_KEYS.SYNC_QUEUE, safeQueue);
             return { success: false, message: 'AUTH_EXPIRED', error: err.message };
          }
          
          // SYNC-7 FIX: Exponential backoff based on retry count
          // 5min * 2^retryCount: 5min, 10min, 20min, 40min, then DLQ
          const retryCount = (item.retryCount || 0) + 1;
          const backoffMs = Math.min(300000 * Math.pow(2, retryCount - 1), 3600000); // cap at 1 hour
          const updatedItem = { ...item, retryCount, lastAttemptAt: Date.now(), backoffMs };
          
          if (retryCount < 5) {
            remainingQueue.push(updatedItem);
          } else {
            // RUTHLESS FIX: Persistent DLQ (Never discard clinical data)
            console.error(`💀 CloudSync: Moving ${item.docId} to Persistent DLQ after 5 failures.`);
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
      
      const latestQueue = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
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
  pullFromCloud: async (user = null, force = false, pullType = null) => {
    if (!db) {
      console.warn('❌ CloudSync: Missing DB for pull.');
      return { success: false, message: 'DB not initialized' };
    }

    // QUOTA FIX: Cooldown guard — skip pull if last pull was within PULL_COOLDOWN_MS.
    // Manual refresh (force=true) bypasses this. Periodic background pulls respect it.
    if (!force) {
      try {
        const lastPullStr = await storage.getRaw('LAST_CLOUD_PULL_AT');
        const lastPull = lastPullStr ? parseInt(lastPullStr) : 0;
        if (Date.now() - lastPull < PULL_COOLDOWN_MS) {
          const waitMin = Math.ceil((PULL_COOLDOWN_MS - (Date.now() - lastPull)) / 60000);
          console.log(`⏳ CloudSync: Pull skipped (cooldown). Next pull in ~${waitMin} min.`);
          return { success: true, pulledCount: 0, skipped: true };
        }
      } catch (_) { /* proceed if storage read fails */ }
    }

    // QUOTA FIX: Delta sync — only fetch records updated since the last successful pull.
    // This reduces reads from O(all records) to O(changed records).
    let lastPullTimestamp = 0;
    try {
      const lastPullStr = await storage.getRaw('LAST_CLOUD_PULL_AT');
      lastPullTimestamp = lastPullStr ? parseInt(lastPullStr) : 0;
    } catch (_) {}

    const startTime = Date.now();
    console.log(`⬇️ CloudSync: Starting Delta Pull (since ${lastPullTimestamp ? new Date(lastPullTimestamp).toISOString() : 'beginning'})...`);

    // Track whether static collections were pulled this session
    const sessionStaticPulled = cloudSyncManager._sessionStaticPulled || false;

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
          // QUOTA FIX: Skip static reference collections if already pulled this session.
          // PHCs, sub-centers, app config don't change during a user's work day.
          if (STATIC_COLLECTIONS.has(col.table) && sessionStaticPulled && !force) {
            console.log(`⏭️ CloudSync: Skipping static collection ${col.table} (already pulled this session).`);
            continue;
          }

          // If no user is logged in:
          // 1. If pullType is 'hierarchy', skip everything except static reference/hierarchy data.
          // 2. Otherwise, skip clinical collections and tasks (which are sensitive/unauthorized), but allow pulling 'users' so legacy credentials sync.
          if (!user) {
            const isStaticOrHierarchy = ['phcs', 'sub_centers', 'villages', 'app_config', 'locked_periods'].includes(col.table);
            const isUsers = col.table === 'users';
            
            if (pullType === 'hierarchy') {
              if (!isStaticOrHierarchy) {
                console.log(`🛡️ Security: Skipping collection ${col.table} for hierarchy-only pull.`);
                continue;
              }
            } else {
              if (!isStaticOrHierarchy && !isUsers) {
                console.log(`🛡️ Security: Skipping collection ${col.table} for unauthenticated pull.`);
                continue;
              }
            }
          }

          // JURISDICTIONAL SECURITY
          let q = collection(db, col.table);

          // Filter users list by PHC for non-admin roles to comply with Firestore rules and protect data
          if (col.table === 'users' && user && user.role !== 'Admin') {
            q = query(q, where('phcId', '==', user.phcId || 'FORCE_BLOCK'));
          }

          if (['members', 'families', 'vital_events', 'claims', 'vhnd_sessions'].includes(col.table)) {

            switch (user.role) {
              case 'ASHA': {
                // SYNC-6 FIX: Firestore 'in' supports up to 30 values.
                // Previously sliced to 10, silently missing villages 11+.
                // Now we batch into chunks of 30 and run parallel queries.
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
                const uniqueVillageIds = [...new Set(assignedVillageIds)];

                // SYNC-5 FIX: Do NOT mutate col._extraQuery (shared const array element).
                // Instead, capture the ashaId snapshot promise locally.
                const BATCH_SIZE = 30;
                const batches = [];
                for (let bIdx = 0; bIdx < uniqueVillageIds.length; bIdx += BATCH_SIZE) {
                  batches.push(uniqueVillageIds.slice(bIdx, bIdx + BATCH_SIZE));
                }

                // Run all village-batch queries + ashaId query in parallel
                const batchSnapshots = await Promise.all([
                  ...batches.map(batch =>
                    getDocs(query(collection(db, col.table), where('villageId', 'in', batch)))
                  ),
                  getDocs(query(collection(db, col.table), where('ashaId', '==', user.id || 'FORCE_BLOCK')))
                ]);

                const cloudData = [];
                const deletedInCloud = [];
                const seenIds = new Set();
                batchSnapshots.forEach(snapshot => {
                  snapshot.forEach(docSnap => {
                    if (seenIds.has(docSnap.id)) return;
                    seenIds.add(docSnap.id);
                    const data = docSnap.data();
                    if (data.deleted === true) deletedInCloud.push(docSnap.id);
                    else cloudData.push({ id: docSnap.id, ...data });
                  });
                });

                shadowBuffer[col.key] = cloudData;
                deletedBuffer[col.key] = deletedInCloud;
                continue; // skip the default getDocs(q) below
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

          // QUOTA FIX: Delta sync — filter by lastUpdatedAt to only fetch changed records.
          // On first pull (lastPullTimestamp=0), fetches everything. Subsequent pulls fetch only changes.
          let querySnapshot;
          if (lastPullTimestamp > 0 && !force) {
            try {
              const deltaQ = query(q, where('lastUpdatedAt', '>', lastPullTimestamp));
              querySnapshot = await getDocs(deltaQ);
            } catch (err) {
              // If composite index is missing for role-based filters + lastUpdatedAt,
              // fallback to fetching everything for this collection to prevent data loss.
              if (err.message && err.message.includes('index')) {
                console.warn(`⚠️ CloudSync: Missing index for delta sync on ${col.table}, falling back to full fetch.`);
                querySnapshot = await getDocs(q);
              } else {
                throw err;
              }
            }
          } else {
            querySnapshot = await getDocs(q);
          }

          const cloudData = [];
          const deletedInCloud = [];
          const seenIds = new Set();

          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            seenIds.add(docSnap.id);
            if (data.deleted === true) deletedInCloud.push(docSnap.id);
            else cloudData.push({ id: docSnap.id, ...data });
          });

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
              // BUG-8 FIX: isFutureLocked should PROTECT local data from being overwritten.
              // A local timestamp implausibly far in the future (clock skew) means we should
              // KEEP the local record — do NOT overwrite it with cloud data.
              const isFutureLocked = localTime > (Date.now() + 86400000);

              if (isFutureLocked) {
                // Preserve local data — just mark it synced so it stops being re-uploaded
                merged[idx] = { ...localItem, syncStatus: 'synced' };
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

        // OPT-1: Invalidate in-memory read cache for all collections updated by cloud pull.
        // This ensures subsequent reads pick up the freshly merged data, not 60s-old snapshots.
        Object.keys(shadowBuffer).forEach(key => storage.invalidateCache(key));

        // QUOTA FIX: Save last successful pull timestamp for delta sync on next pull
        await storage.saveRaw('LAST_CLOUD_PULL_AT', startTime.toString());

        // Mark static collections as pulled for this session
        cloudSyncManager._sessionStaticPulled = true;

        const elapsed = Date.now() - startTime;
        console.log(`✅ CloudSync: Delta Pull merged in ${elapsed}ms — pulled:${totalPulled} removed:${totalDeleted}`);
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
