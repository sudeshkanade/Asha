import { storage, STORAGE_KEYS } from './storage';
import { db } from './firebaseConfig';
import { collection, addDoc, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

export const cloudSyncManager = {
  isSyncing: false,

  /**
   * Reads local sync_queue and pushes each event to Firebase Firestore.
   * If successful, removes from the queue.
   */
  startBackgroundSync: async () => {
    if (cloudSyncManager.isSyncing) return { success: false, message: 'Sync already in progress' };
    
    if (!db) {
      console.warn("Cloud Sync: Firebase DB not initialized.");
      return { success: false, message: 'Firebase not initialized' };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.log("Cloud Sync: Offline.");
        return { success: false, message: 'Offline' };
    }

    cloudSyncManager.isSyncing = true;
    try {
      const queue = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
      if (!queue || queue.length === 0) {
        cloudSyncManager.isSyncing = false;
        return { success: true, syncedCount: 0 };
      }

      console.log(`Cloud Sync: Processing ${queue.length} items...`);
      
      const remainingQueue = [];
      let syncedCount = 0;
      let firstError = null;
      
      const getFirestoreCollectionName = (storageKey) => {
        const mapping = {
          [STORAGE_KEYS.PHCS]: 'phcs',
          [STORAGE_KEYS.SUB_CENTERS]: 'sub_centers',
          [STORAGE_KEYS.VILLAGES]: 'villages',
          [STORAGE_KEYS.MEMBERS]: 'members',
          [STORAGE_KEYS.FAMILIES]: 'families',
          [STORAGE_KEYS.USERS]: 'users',
          [STORAGE_KEYS.VITAL_EVENTS]: 'vital_events',
          [STORAGE_KEYS.VHND_SESSIONS]: 'vhnd_sessions',
          'tasks': 'tasks',
          'claims': 'claims'
        };
        return mapping[storageKey] || storageKey;
      };

      for (const item of queue) {
        try {
          const storageKey = item.tableName;
          const { payload, timestamp, type } = item;
          if (!storageKey || !payload) continue;

          let tableName = getFirestoreCollectionName(storageKey);
          // Safety: Remove invalid characters (@, $, etc) from collection names
          tableName = tableName.replace(/[^a-zA-Z0-9_]/g, ''); 
          
          const docId = payload.id ? payload.id.toString() : null;
          if (!docId) continue;

          // Timeout-protected sync operation
          const syncPromise = (async () => {
            if (type === 'delete') {
              await setDoc(doc(db, tableName, docId), { 
                deleted: true, 
                _lastSyncedAt: new Date().toISOString() 
              }, { merge: true });
            } else {
              await setDoc(doc(db, tableName, docId), {
                  ...payload,
                  _lastSyncedAt: new Date().toISOString(),
                  _originalTimestamp: timestamp
              }, { merge: true });
            }
          })();

          await Promise.race([
            syncPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Sync Timeout')), 10000))
          ]);

          syncedCount++;
        } catch (err) {
          console.error("Cloud Sync Error for item:", err);
          if (!firstError) firstError = err.message;
          remainingQueue.push(item);
        }
      }

      await storage.saveAll(STORAGE_KEYS.SYNC_QUEUE, remainingQueue);
      return { 
        success: syncedCount > 0 || queue.length === 0, 
        syncedCount,
        error: firstError 
      };
    } catch (e) {
      console.error("Cloud Sync Critical Error:", e);
      return { success: false, error: e.message };
    } finally {
      cloudSyncManager.isSyncing = false;
    }
  },

  /**
   * Pulls data from Firestore and updates local storage
   */
  pullFromCloud: async () => {
    if (!db) return { success: false, message: 'Firebase not initialized' };
    
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
        { key: STORAGE_KEYS.LOCKED_PERIODS, table: 'locked_periods' }
      ];

      let totalPulled = 0;
      const tombstones = await storage.getAll(STORAGE_KEYS.DELETED_IDS) || [];

      for (const col of collectionsToPull) {
        const querySnapshot = await getDocs(collection(db, col.table));
        const cloudData = [];
        const deletedInCloud = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Filter out tombstones and soft-deleted items
          if (data.deleted === true || tombstones.includes(doc.id)) {
            deletedInCloud.push(doc.id);
          } else {
            cloudData.push({ id: doc.id, ...data });
          }
        });

        if (cloudData.length > 0 || deletedInCloud.length > 0) {
          const localData = await storage.getAll(col.key);
          
          // Advanced Merge: Protect local pending changes and compare timestamps
          let merged = [...localData];
          
          cloudData.forEach(cd => {
            const idx = merged.findIndex(ld => ld.id === cd.id);
            if (idx >= 0) {
              const localItem = merged[idx];
              
              // Only overwrite if:
              // 1. Local item is NOT pending sync, OR
              // 2. Cloud item has a strictly newer timestamp
              const cloudTime = cd.lastUpdatedAt || 0;
              const localTime = localItem.lastUpdatedAt || 0;
              
              if (localItem.syncStatus !== 'pending' || cloudTime > localTime) {
                merged[idx] = { ...localItem, ...cd, syncStatus: 'synced' };
              }
            } else {
              merged.push({ ...cd, syncStatus: 'synced' });
            }
          });

          // Remove items deleted in cloud (Tombstone enforcement)
          merged = merged.filter(item => !deletedInCloud.includes(item.id));

          await storage.saveAll(col.key, merged);
          totalPulled += cloudData.length;
        }
      }

      return { success: true, pulledCount: totalPulled };
    } catch (e) {
      console.error('Cloud Pull Error', e);
      return { success: false, message: e.message };
    }
  }
};
