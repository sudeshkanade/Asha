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
   * Lock helper to serialize critical sections
   */
  withLock: async (fn) => {
    storageLock = storageLock.then(async () => {
      try {
        return await fn();
      } catch (e) {
        console.error('❌ Storage Lock Error:', e);
        throw e;
      }
    });
    return storageLock;
  },

  /**
   * Generate a globally unique ID (timestamp + user prefix + random)
   */
  generateId: (prefix = 'id', userId = 'unknown') => {
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
    return storage.withLock(async () => {
      try {
        const existingData = await storage.getAll(key);
        const timestamp = new Date().getTime();
        
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

        const tombstones = await storage.getAll(STORAGE_KEYS.DELETED_IDS);
        if (tombstones.includes(newData.id.toString())) {
          const updatedTombstones = tombstones.filter(id => id !== newData.id.toString());
          await storage.saveAll(STORAGE_KEYS.DELETED_IDS, updatedTombstones);
        }

        const existingIndex = existingData.findIndex(item => item.id === newData.id);
        let updatedCollection = [...existingData];
        
        if (existingIndex >= 0) {
          const localItem = existingData[existingIndex];
          const mergedHealthData = { ...(localItem.healthData || {}) };
          const incomingHealthData = newData.healthData || {};
          
          Object.keys(incomingHealthData).forEach(field => {
             const incomingTime = incomingHealthData.lastUpdatedAt || timestamp;
             const localTime = localItem.lastUpdatedAt || 0;
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
        
        if (key === STORAGE_KEYS.MEMBERS) {
           await storage.updateSummary(newData, (existingIndex >= 0 ? existingData[existingIndex] : null));
        }

        await storage.addToSyncQueue(key, newData);
        return true;
      } catch (e) {
        console.error('❌ Storage.save error:', e);
        return false;
      }
    });
  },

  updateSummary: async (newData, oldData) => {
    try {
      const summaryStr = await AsyncStorage.getItem('PHC_SUMMARY');
      const summary = summaryStr ? JSON.parse(summaryStr) : {
        totalMembers: 0, totalPregnant: 0, totalHighRisk: 0, totalChildren: 0
      };

      if (oldData) {
        summary.totalMembers--;
        if (oldData.healthData?.isPregnant) summary.totalPregnant--;
        if (oldData.healthData?.isHighRisk) summary.totalHighRisk--;
        if ((parseInt(oldData.age) || 0) < 5) summary.totalChildren--;
      }

      summary.totalMembers++;
      if (newData.healthData?.isPregnant) summary.totalPregnant++;
      if (newData.healthData?.isHighRisk) summary.totalHighRisk++;
      if ((parseInt(newData.age) || 0) < 5) summary.totalChildren++;

      await AsyncStorage.setItem('PHC_SUMMARY', JSON.stringify(summary));
    } catch (e) {
      console.error('❌ Summary Error:', e);
    }
  },

  saveAll: async (key, items) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(items));
      return true;
    } catch (e) {
      console.error('❌ Storage.saveAll error:', e);
      return false;
    }
  },

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
      }
    }
  },

  getRaw: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },

  saveRaw: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {}
  },

  purgeOrphanedData: async (user) => {
    if (!user || user.role === 'Admin') return;
    const collectionsToCheck = [STORAGE_KEYS.MEMBERS, STORAGE_KEYS.FAMILIES, STORAGE_KEYS.VITAL_EVENTS];
    for (const key of collectionsToCheck) {
      const data = await storage.getAll(key);
      const filtered = data.filter(item => {
        return (user.role === 'ASHA' && item.villageId === user.villageId) ||
               (['ANM', 'MPW', 'CHO'].includes(user.role) && item.subCenterId === user.subCenterId) ||
               (user.role === 'MO' && item.phcId === user.phcId);
      });

      if (filtered.length < data.length) {
        await storage.saveAll(key, filtered);
      }
    }
  },

  cleanupTombstones: async () => {
    return await storage.withLock(async () => {
      const collections = Object.values(STORAGE_KEYS);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      for (const key of collections) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (!value) continue;
          const data = JSON.parse(value);
          const filtered = data.filter(item => {
            if (!item.deleted) return true;
            return (item._deletedAt && new Date(item._deletedAt).getTime() > thirtyDaysAgo);
          });
          if (filtered.length !== data.length) {
            await AsyncStorage.setItem(key, JSON.stringify(filtered));
          }
        } catch (e) {}
      }
    });
  },

  update: async (tableName, updateFn) => {
    return await storage.withLock(async () => {
      const currentData = await storage.getAll(tableName);
      const newData = updateFn(currentData);
      if (!newData) return null; 
      await storage.saveAll(tableName, newData);
      return newData;
    });
  },

  getAll: async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value != null ? JSON.parse(value) : [];
    } catch (e) {
      return [];
    }
  },

  addToSyncQueue: async (tableName, payload, type = 'save') => {
    return await storage.update(STORAGE_KEYS.SYNC_QUEUE, (queue) => {
      const syncItem = {
        id: storage.generateId('sync'),
        tableName,
        docId: payload.id,
        payload,
        type,
        timestamp: Date.now()
      };
      const existingIdx = queue.findIndex(q => q.docId === payload.id && q.tableName === tableName && q.type === 'save');
      if (existingIdx >= 0 && type === 'save') {
        queue[existingIdx] = syncItem;
      } else {
        queue.push(syncItem);
      }
      return queue;
    });
  },

  addToDeleteQueue: async (tableName, id) => {
    if (!id) return;
    if (tableName === STORAGE_KEYS.MEMBERS) {
      const dependentKeys = [STORAGE_KEYS.VITAL_EVENTS, STORAGE_KEYS.CLAIMS, STORAGE_KEYS.TASK_COMPLETIONS];
      for (const depKey of dependentKeys) {
        await storage.update(depKey, (data) => data.filter(item => item.memberId !== id && item.id !== id));
      }
    }
    if (tableName === STORAGE_KEYS.FAMILIES) {
      const memberData = await storage.getAll(STORAGE_KEYS.MEMBERS);
      const membersToDelete = memberData.filter(m => m.familyId === id);
      for (const member of membersToDelete) {
        await storage.addToDeleteQueue(STORAGE_KEYS.MEMBERS, member.id);
      }
    }
    await storage.addToSyncQueue(tableName, { id }, 'delete');
    
    // Add to local tombstones
    await storage.update(STORAGE_KEYS.DELETED_IDS, (tombstones) => {
      if (!tombstones.includes(id.toString())) {
        return [...tombstones, id.toString()];
      }
      return tombstones;
    });
  },

  init: async () => {
     // Initialization logic if needed (e.g. creating default config)
     return true;
  },

  clearAll: async () => {
    await AsyncStorage.clear();
  }
};
