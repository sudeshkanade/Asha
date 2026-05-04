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

          const tableName = getFirestoreCollectionName(storageKey);
          const colRef = collection(db, tableName);
          const docId = payload.id ? payload.id.toString() : null;

          if (type === 'delete' && docId) {
            // Soft Delete in Cloud (Robust for multi-device)
            await setDoc(doc(db, tableName, docId), { 
              deleted: true, 
              _lastSyncedAt: new Date().toISOString() 
            }, { merge: true });
            console.log(`Cloud Sync: Soft-Deleted ${docId} from ${tableName}`);
          } else if (docId) {
             // Save/Update
             await setDoc(doc(db, tableName, docId), {
                ...payload,
                _lastSyncedAt: new Date().toISOString(),
                _originalTimestamp: timestamp
             }, { merge: true });
          } else {
             // New entry without ID
             await addDoc(colRef, {
                ...payload,
                _lastSyncedAt: new Date().toISOString(),
                _originalTimestamp: timestamp
             });
          }
          syncedCount++;
        } catch (err) {
          console.error("Cloud Sync: Item failed", err);
          if (!firstError) firstError = err.message;
          remainingQueue.push(item);
        }
      }

      await storage.saveAll(STORAGE_KEYS.SYNC_QUEUE, remainingQueue);
      return { 
        success: syncedCount > 0 || queue.length === 0, 
        syncedCount, 
        remainingCount: remainingQueue.length,
        error: firstError
      };
    } catch (e) {
      console.error("Cloud Sync Error:", e);
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
        { key: STORAGE_KEYS.FAMILIES, table: 'families' }
      ];

      let totalPulled = 0;
      const tombstones = await storage.getAll(STORAGE_KEYS.DELETED_IDS);

      for (const col of collectionsToPull) {
        const querySnapshot = await getDocs(collection(db, col.table));
        const cloudData = [];
        const deletedInCloud = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.deleted === true || tombstones.includes(doc.id)) {
            deletedInCloud.push(doc.id);
          } else {
            cloudData.push({ id: doc.id, ...data });
          }
        });

        // 1. Handle items to be pulled/updated
        const localData = await storage.getAll(col.key);
        let merged = [...localData];

        if (cloudData.length > 0) {
          cloudData.forEach(cloudItem => {
            const idx = merged.findIndex(localItem => localItem.id == cloudItem.id);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...cloudItem };
            } else {
              merged.push(cloudItem);
            }
          });
        }

        // 2. Handle items to be removed locally (because they are deleted in cloud)
        if (deletedInCloud.length > 0) {
          merged = merged.filter(item => !deletedInCloud.includes(item.id?.toString()));
        }

        await storage.saveAll(col.key, merged);
        totalPulled += cloudData.length;
      }

      return { success: true, pulledCount: totalPulled };
    } catch (e) {
      console.error("Cloud Pull Error:", e);
      return { success: false, error: e.message };
    }
  }
};
