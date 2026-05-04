import { storage, STORAGE_KEYS } from './storage';
import { db } from './firebaseConfig';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

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

          const syncPromise = (async () => {
            if (type === 'delete') {
              await setDoc(doc(db, collectionName, docId), {
                deleted: true,
                _deletedAt: new Date().toISOString(),
                _lastSyncedAt: new Date().toISOString(),
              }, { merge: true });
            } else {
              await setDoc(doc(db, collectionName, docId), {
                ...payload,
                _lastSyncedAt: new Date().toISOString(),
                _originalTimestamp: timestamp,
              }, { merge: true });
            }
          })();

          await Promise.race([
            syncPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout: ${collectionName}/${docId}`)), 10000)
            ),
          ]);

          syncedCount++;
        } catch (err) {
          console.error(`❌ CloudSync [${i}]: FAILED —`, err.message);
          if (!firstError) firstError = err.message;
          remainingQueue.push(item);
        }
      }

      await storage.saveAll(STORAGE_KEYS.SYNC_QUEUE, remainingQueue);

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
   */
  pullFromCloud: async () => {
    if (!db) {
      console.warn('❌ CloudSync: Firebase DB not initialized (pull).');
      return { success: false, message: 'Firebase not initialized' };
    }

    const startTime = Date.now();
    console.log('⬇️ CloudSync: Starting pull from cloud...');

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
        { key: STORAGE_KEYS.LOCKED_PERIODS, table: 'locked_periods' },
        { key: STORAGE_KEYS.APP_CONFIG, table: 'app_config' },
      ];

      let totalPulled = 0;
      let totalDeleted = 0;
      const tombstones = await storage.getAll(STORAGE_KEYS.DELETED_IDS) || [];

      for (const col of collectionsToPull) {
        try {
          const querySnapshot = await getDocs(collection(db, col.table));
          const cloudData = [];
          const deletedInCloud = [];

          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.deleted === true || tombstones.includes(docSnap.id)) {
              deletedInCloud.push(docSnap.id);
            } else {
              cloudData.push({ id: docSnap.id, ...data });
            }
          });

          if (cloudData.length > 0 || deletedInCloud.length > 0) {
            const localData = await storage.getAll(col.key);

            // Advanced Merge: Protect local pending changes
            let merged = [...localData];

            cloudData.forEach((cd) => {
              const idx = merged.findIndex((ld) => ld.id === cd.id);
              if (idx >= 0) {
                const localItem = merged[idx];
                const cloudTime = cd.lastUpdatedAt || cd._lastSyncedAt || 0;
                const localTime = localItem.lastUpdatedAt || 0;

                if (localItem.syncStatus !== 'pending' || cloudTime > localTime) {
                  merged[idx] = { ...localItem, ...cd, syncStatus: 'synced' };
                }
              } else {
                merged.push({ ...cd, syncStatus: 'synced' });
              }
            });

            // Remove items deleted in cloud
            if (deletedInCloud.length > 0) {
              const beforeCount = merged.length;
              merged = merged.filter((m) => !deletedInCloud.includes(m.id));
              const removedCount = beforeCount - merged.length;
              if (removedCount > 0) {
                console.log(`🗑️ CloudSync: Removed ${removedCount} deleted items from ${col.table}`);
                totalDeleted += removedCount;
              }
            }

            await storage.saveAll(col.key, merged);
            totalPulled += cloudData.length;
          }

          console.log(`📥 ${col.table}: ${cloudData.length} live, ${deletedInCloud.length} deleted`);
        } catch (colErr) {
          console.error(`❌ CloudSync: Failed to pull ${col.table}:`, colErr.message);
        }
      }

      const elapsed = Date.now() - startTime;
      console.log(`✅ CloudSync: Pull done in ${elapsed}ms — pulled:${totalPulled} removed:${totalDeleted}`);

      return { success: true, pulledCount: totalPulled, deletedCount: totalDeleted };
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
