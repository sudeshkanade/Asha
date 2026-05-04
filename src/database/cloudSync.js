import { storage, STORAGE_KEYS } from './storage';
import { db } from './firebaseConfig';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

export const cloudSyncManager = {
  isSyncing: false,

  /**
   * Reads local sync_queue and pushes each event to Firebase Firestore.
   * If successful, removes from the queue.
   */
  startBackgroundSync: async () => {
    if (cloudSyncManager.isSyncing) return;
    
    // Skip if no db instance (e.g. invalid config)
    if (!db) {
      console.warn("Cloud Sync: Firebase DB not initialized.");
      return;
    }

    // In a browser environment, verify online status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.log("Cloud Sync: Offline. Sync skipped.");
        return;
    }

    cloudSyncManager.isSyncing = true;
    try {
      const queue = await storage.getSyncQueue();
      if (!queue || queue.length === 0) {
        cloudSyncManager.isSyncing = false;
        return;
      }

      console.log(`Cloud Sync: Starting sync for ${queue.length} items...`);
      
      const newQueue = [];
      let syncedCount = 0;
      
      for (const item of queue) {
        try {
          // Destructure properties carefully since payloads can vary
          const { tableName, payload, timestamp } = item;
          
          // Using tableName as the Firestore collection name 
          // (e.g. 'members', 'families', 'vital_events', 'vhnd_sessions')
          const colRef = collection(db, tableName);
          
          if (payload && payload.id) {
             // If payload has a unique ID, use it as the Firestore document ID to avoid duplicates
             await setDoc(doc(db, tableName, payload.id.toString()), {
                ...payload,
                _syncTimestamp: timestamp || new Date().toISOString()
             });
          } else {
             // Otherwise let Firestore generate a random ID
             await addDoc(colRef, {
                ...payload,
                _syncTimestamp: timestamp || new Date().toISOString()
             });
          }
          console.log(`Cloud Sync: Synced ${tableName} event.`);
          syncedCount++;
        } catch (err) {
          console.error("Cloud Sync: Failed to sync item", err);
          // Keep item in queue for retry
          newQueue.push(item);
        }
      }

      // Update queue with only the items that failed
      await storage.save(STORAGE_KEYS.SYNC_QUEUE, newQueue);
      console.log(`Cloud Sync: Finished. Synced ${syncedCount} items. ${newQueue.length} items remaining.`);
      
    } catch (e) {
      console.error("Cloud Sync: Critical Error:", e);
    } finally {
      cloudSyncManager.isSyncing = false;
    }
  }
};
