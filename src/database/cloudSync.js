import { storage, STORAGE_KEYS } from './storage';
import { db } from './firebaseConfig';
import { collection, addDoc, doc, setDoc, getDocs } from 'firebase/firestore';

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
      
      // Process items in small batches or one by one
      for (const item of queue) {
        try {
          const { tableName, payload, timestamp } = item;
          if (!tableName || !payload) continue;

          const colRef = collection(db, tableName);
          
          // Use payload.id as document ID if available, otherwise auto-generate
          const docId = payload.id ? payload.id.toString() : null;

          if (docId) {
             await setDoc(doc(db, tableName, docId), {
                ...payload,
                _lastSyncedAt: new Date().toISOString(),
                _originalTimestamp: timestamp
             }, { merge: true });
          } else {
             await addDoc(colRef, {
                ...payload,
                _lastSyncedAt: new Date().toISOString(),
                _originalTimestamp: timestamp
             });
          }
          syncedCount++;
        } catch (err) {
          console.error("Cloud Sync: Item failed", err);
          remainingQueue.push(item); // Keep for retry
        }
      }

      await storage.saveAll(STORAGE_KEYS.SYNC_QUEUE, remainingQueue);
      return { 
        success: true, 
        syncedCount, 
        remainingCount: remainingQueue.length 
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

      for (const col of collectionsToPull) {
        const querySnapshot = await getDocs(collection(db, col.table));
        const cloudData = [];
        querySnapshot.forEach((doc) => {
          cloudData.push({ id: doc.id, ...doc.data() });
        });

        if (cloudData.length > 0) {
          const localData = await storage.getAll(col.key);
          
          // Simple merge: Use Cloud data as source of truth for items with same ID
          const merged = [...localData];
          cloudData.forEach(cloudItem => {
            const idx = merged.findIndex(localItem => localItem.id == cloudItem.id);
            if (idx >= 0) {
              // Update existing
              merged[idx] = { ...merged[idx], ...cloudItem };
            } else {
              // Add new
              merged.push(cloudItem);
            }
          });

          await storage.saveAll(col.key, merged);
          totalPulled += cloudData.length;
        }
      }

      return { success: true, pulledCount: totalPulled };
    } catch (e) {
      console.error("Cloud Pull Error:", e);
      return { success: false, error: e.message };
    }
  }
};
