import AsyncStorage from '@react-native-async-storage/async-storage';
import { cloudSyncManager } from './cloudSync';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from './constants';

/**
 * Universal Storage Engine for Rural Health Tracker
 * Handles persistence for both Web and Native environments
 * with conflict resolution and background sync queuing.
 */



export { STORAGE_KEYS };

// RUTHLESS FIX: Sequential Write Queue to prevent concurrent Read-Modify-Write conflicts
let storageLock = Promise.resolve();

export const storage = {
  /**
   * Generate a globally unique ID (timestamp + user prefix + random)
   */
  generateId: (prefix = 'id', userId = 'unknown') => {
    // RUTHLESS FIX: High-entropy ID to prevent collisions on low-cost tablets with bad clocks
    const entropy = Math.random().toString(36).substr(2, 9);
    const timePart = Date.now().toString(36);
    const userPart = userId.slice(-6);
    return `${prefix}_${timePart}_${userPart}_${entropy}`.toUpperCase();
  },

  /**
   * Check if a specific month/year is locked for editing
   */
  isPeriodLocked: async (month, year) => {
    const locked = await storage.getAll(STORAGE_KEYS.LOCKED_PERIODS);
    return locked.some(p => p.id === `${month}-${year}`);
  },

  /**
   * Save a record with Conflict Resolution (Last-Write-Wins)
   */
  save: async (key, data) => {
    // Chain onto the lock to ensure sequential execution
    return storageLock = storageLock.then(async () => {
      try {
        const existingData = await storage.getAll(key);
        const timestamp = new Date().getTime();
        
        // ... (rest of normalization logic)
        let normalizedData = { ...data };
        if (key === STORAGE_KEYS.MEMBERS) {
          normalizedData = {
            ...normalizedData,
            firstName: normalizedData.firstName || normalizedData.fname || '',
            lastName: normalizedData.lastName || normalizedData.lname || '',
            healthData: {
              ...(normalizedData.healthData || {}),
              isPregnant: normalizedData.healthData?.isPregnant ?? (normalizedData.isPregnant === 'yes' || normalizedData.isPregnant === true),
            }
          };
        }

        const newData = { 
          ...normalizedData, 
          id: normalizedData.id || storage.generateId(key.replace('@rural_health_', '').slice(0, 3), normalizedData.ashaId || 'sys'), 
          syncStatus: 'pending',
          lastUpdatedAt: timestamp 
        };

        // RUTHLESS FIX: Tombstone Reconciliation
        // If we are saving an ID that was previously marked for deletion, clear the tombstone
        const tombstones = await storage.getAll(STORAGE_KEYS.DELETED_IDS);
        if (tombstones.includes(newData.id.toString())) {
          const updatedTombstones = tombstones.filter(id => id !== newData.id.toString());
          await storage.saveAll(STORAGE_KEYS.DELETED_IDS, updatedTombstones);
          console.log(`♻️ Storage: Cleared tombstone for ${newData.id} during re-save.`);
        }

        const existingIndex = existingData.findIndex(item => item.id === newData.id);
        let updatedCollection = [...existingData];
        
        if (existingIndex >= 0) {
          const localItem = existingData[existingIndex];
          
          // RUTHLESS FIX: Field-Level Conflict Resolution
          // Only overwrite fields if the incoming data is newer than the existing local record
          // This prevents a stale UI from wiping out a fresh background sync
          const mergedHealthData = { ...(localItem.healthData || {}) };
          const incomingHealthData = newData.healthData || {};
          
          Object.keys(incomingHealthData).forEach(field => {
             const incomingTime = incomingHealthData.lastUpdatedAt || timestamp;
             const localTime = localItem.lastUpdatedAt || 0;
             
             // If local record is newer (e.g. from a recent sync), protect it
             if (localTime <= incomingTime) {
                mergedHealthData[field] = incomingHealthData[field];
             }
          });

          updatedCollection[existingIndex] = {
            ...localItem,
            ...newData,
            healthData: mergedHealthData,
            lastUpdatedAt: Math.max(localItem.lastUpdatedAt || 0, timestamp)
          };
        } else {
          updatedCollection.push(newData);
        }

        await AsyncStorage.setItem(key, JSON.stringify(updatedCollection));
        
        // RUTHLESS FIX: Incremental Stat Hub (Prevent OOM Dashboards)
        if (key === STORAGE_KEYS.MEMBERS) {
           await storage.updateSummary(newData, localItem || null);
        }

        await storage.addToSyncQueue(key, newData);
        return true;
      } catch (e) {
        console.error('❌ Storage.save error:', e);
        return false;
      }
    });
  },

  /**
   * Incremental Summary Updater for Dashboards (O(1) dashboard loading)
   */
  updateSummary: async (newData, oldData) => {
    try {
      const summary = (await AsyncStorage.getItem('PHC_SUMMARY')) ? JSON.parse(await AsyncStorage.getItem('PHC_SUMMARY')) : {
        totalMembers: 0,
        totalPregnant: 0,
        totalHighRisk: 0,
        totalChildren: 0
      };

      // Subtract old state if updating
      if (oldData) {
        summary.totalMembers--;
        if (oldData.healthData?.isPregnant) summary.totalPregnant--;
        if (oldData.healthData?.isHighRisk) summary.totalHighRisk--;
        if ((parseInt(oldData.age) || 0) < 5) summary.totalChildren--;
      }

      // Add new state
      summary.totalMembers++;
      if (newData.healthData?.isPregnant) summary.totalPregnant++;
      if (newData.healthData?.isHighRisk) summary.totalHighRisk++;
      if ((parseInt(newData.age) || 0) < 5) summary.totalChildren++;

      await AsyncStorage.setItem('PHC_SUMMARY', JSON.stringify(summary));
    } catch (e) {
      console.error('❌ Summary Error:', e);
    }
  },

  /**
   * Save entire collection (Bulk update / Deletion)
   */
  saveAll: async (key, items) => {
    return storageLock = storageLock.then(async () => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(items));
        return true;
      } catch (e) {
        console.error('❌ Storage.saveAll error:', e);
        return false;
      }
    });
  },

  /**
   * Remove synced logs older than 90 days to prevent QuotaExceeded errors
   */
  autoPrune: async () => {
    const logKeys = [STORAGE_KEYS.STOCK, STORAGE_KEYS.IDSP_SURVEILLANCE, STORAGE_KEYS.VECTOR_SURVEYS];
    const threshold = Date.now() - (90 * 24 * 60 * 60 * 1000);
    
    for (const key of logKeys) {
      const data = await storage.getAll(key);
      const filtered = data.filter(item => 
        item.syncStatus !== 'synced' || item.lastUpdatedAt > threshold
      );
      if (filtered.length < data.length) {
        await storage.saveAll(key, filtered);
        console.log(`🧹 Storage: Pruned ${data.length - filtered.length} records from ${key}`);
      }
    }
  },

  /**
   * Get raw string value
   */
  getRaw: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },

  /**
   * Save raw string value
   */
  saveRaw: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {}
  },

  /**
   * SECURITY: Purge records that no longer belong to the user's jurisdiction
   */
  purgeOrphanedData: async (user) => {
    if (!user || user.role === 'Admin') return;
    
    const collectionsToCheck = [STORAGE_KEYS.MEMBERS, STORAGE_KEYS.FAMILIES, STORAGE_KEYS.VITAL_EVENTS];
    for (const key of collectionsToCheck) {
      const data = await storage.getAll(key);
      let orphanedCount = 0;
      const filtered = data.filter(item => {
        const isOrphaned = 
          (user.role === 'ASHA' && item.villageId !== user.villageId) ||
          (['ANM', 'MPW', 'CHO'].includes(user.role) && item.subCenterId !== user.subCenterId) ||
          (user.role === 'MO' && item.phcId !== user.phcId);
        
        if (isOrphaned) orphanedCount++;
        return !isOrphaned;
      });

      if (orphanedCount > 0) {
        await storage.saveAll(key, filtered);
        console.log(`🛡️ Security: Purged ${orphanedCount} orphaned records from ${key} due to jurisdiction change.`);
      }
    }
  },

  /**
   * Get all records for a collection with Schema Normalization
   */
  getAll: async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value != null ? JSON.parse(value) : [];
    } catch (e) {
      console.error('❌ Storage.getAll error:', e);
      return [];
    }
  },

  /**
   * Add item to sync queue for later background upload
   */
  addToSyncQueue: async (tableName, payload) => {
    try {
      const queue = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
      const updatedQueue = [...queue, { 
        tableName, 
        payload, 
        type: 'save',
        timestamp: new Date().toISOString() 
      }];
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updatedQueue));
      // SECURITY FIX: Do not log full PII payloads to system console
      console.log(`📝 SyncQueue: Queued SAVE for ${tableName} (id: ${payload?.id})`);
      // Fire-and-forget background sync
      cloudSyncManager.startBackgroundSync().catch(() => {});
    } catch (e) {
      console.error('❌ Sync Queue Error:', e);
    }
  },

  /**
   * Specifically queue a deletion for the cloud
   */
  addToDeleteQueue: async (tableName, id) => {
    if (!id) {
      console.warn('⚠️ Delete Queue: Missing ID for', tableName);
      return;
    }
    try {
      // RUTHLESS FIX: Cascading Deletion to prevent orphaned clinical records
      if (tableName === STORAGE_KEYS.MEMBERS) {
        const dependentKeys = [STORAGE_KEYS.VITAL_EVENTS, STORAGE_KEYS.CLAIMS, STORAGE_KEYS.TASK_COMPLETIONS];
        for (const depKey of dependentKeys) {
           const depData = await storage.getAll(depKey);
           const filteredDep = depData.filter(item => item.memberId !== id && item.id !== id);
           if (filteredDep.length < depData.length) {
             await storage.saveAll(depKey, filteredDep);
             console.log(`🧹 Referential Integrity: Purged orphaned records from ${depKey}`);
           }
        }
      }

      // RUTHLESS FIX: Cascading Deletion for Families
      if (tableName === STORAGE_KEYS.FAMILIES) {
        const memberData = await storage.getAll(STORAGE_KEYS.MEMBERS);
        const membersToDelete = memberData.filter(m => m.familyId === id);
        for (const member of membersToDelete) {
           await storage.addToDeleteQueue(STORAGE_KEYS.MEMBERS, member.id);
        }
        console.log(`🧹 Structural Integrity: Purged ${membersToDelete.length} orphaned members from deleted family ${id}`);
      }
      const queue = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
      const updatedQueue = [...queue, { 
        tableName, 
        payload: { id }, 
        type: 'delete',
        timestamp: new Date().toISOString() 
      }];
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updatedQueue));
      
      // 2. Add to local Tombstones to prevent re-pulling before sync finishes
      const tombstones = await storage.getAll(STORAGE_KEYS.DELETED_IDS);
      if (!tombstones.includes(id.toString())) {
        await storage.saveAll(STORAGE_KEYS.DELETED_IDS, [...tombstones, id.toString()]);
      }

      console.log(`🗑️ SyncQueue: Queued DELETE for ${tableName} (id: ${id}) — total: ${updatedQueue.length}`);
      // Fire-and-forget background sync
      cloudSyncManager.startBackgroundSync().catch(() => {});
    } catch (e) {
      console.error('❌ Delete Queue Error:', e);
    }
  },

  /**
   * Factory Reset: Clear all local data
   */
  wipeAllData: async () => {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (e) {
      console.error('❌ Error wiping data:', e);
      return false;
    }
  }
};
