import AsyncStorage from '@react-native-async-storage/async-storage';
import { cloudSyncManager } from './cloudSync';
import { Platform } from 'react-native';

/**
 * Universal Storage Engine for Rural Health Tracker
 * Handles persistence for both Web and Native environments
 * with conflict resolution and background sync queuing.
 */

export const STORAGE_KEYS = {
  MEMBERS: '@rural_health_members',
  FAMILIES: '@rural_health_families',
  SYNC_QUEUE: 'asha_sync_queue',
  TASKS: 'asha_tasks',
  CLAIMS: 'asha_claims',
  TASK_COMPLETIONS: 'asha_task_completions',
  APP_CONFIG: 'asha_app_config',
  LOCKED_PERIODS: 'asha_locked_periods',
  VILLAGES: '@rural_health_villages',
  USERS: '@rural_health_users',
  PHCS: '@rural_health_phcs',
  SUB_CENTERS: '@rural_health_subcenters',
  DELETED_IDS: 'asha_deleted_ids',
  VHND_SESSIONS: '@rural_health_vhnd',
  VITAL_EVENTS: '@rural_health_vital_events',
};

export const storage = {
  /**
   * Generate a globally unique ID (timestamp + user prefix + random)
   */
  generateId: (prefix = 'id', userId = 'unknown') => {
    return `${prefix}_${Date.now()}_${userId.slice(-4)}_${Math.random().toString(36).substr(2, 5)}`;
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
    try {
      const existingData = await storage.getAll(key);
      const timestamp = new Date().getTime();
      
      const newData = { 
        ...data, 
        id: data.id || storage.generateId(key.replace('@rural_health_', '').slice(0, 3), data.ashaId || 'sys'), 
        syncStatus: 'pending',
        lastUpdatedAt: timestamp 
      };

      const existingIndex = existingData.findIndex(item => item.id === newData.id);
      let updatedCollection = [...existingData];
      
      if (existingIndex >= 0) {
        if (existingData[existingIndex].lastUpdatedAt < timestamp) {
          updatedCollection[existingIndex] = newData;
        } else {
          return false; // Existing record is newer
        }
      } else {
        updatedCollection.push(newData);
      }

      await AsyncStorage.setItem(key, JSON.stringify(updatedCollection));
      // Queue for cloud sync (addToSyncQueue handles triggering background sync)
      await storage.addToSyncQueue(key, newData);
      return true;
    } catch (e) {
      console.error('❌ Storage.save error:', e);
      return false;
    }
  },

  /**
   * Save entire collection (Bulk update / Deletion)
   */
  saveAll: async (key, items) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(items));
      return true;
    } catch (e) {
      console.error('❌ Storage.saveAll error:', e);
      return false;
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
   * Get all records for a collection with Schema Normalization
   */
  getAll: async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      let data = value != null ? JSON.parse(value) : [];

      // Schema Normalization Layer: Ensure legacy data formats are compatible with current UI
      if (key === STORAGE_KEYS.MEMBERS && Array.isArray(data)) {
        return data.map(m => ({
          ...m,
          firstName: m.firstName || m.fname || '',
          lastName: m.lastName || m.lname || '',
          middleName: m.middleName || m.mname || '',
          phone: m.phone || m.mobile || '',
          relation: m.relation || m.relationship || 'Other',
          maritalStatus: m.maritalStatus || m.marital || 'Married',
          healthData: {
            ...(m.healthData || {}),
            isPregnant: m.healthData?.isPregnant ?? (m.isPregnant === 'yes' || m.isPregnant === true),
            isHighRisk: m.healthData?.isHighRisk ?? (m.isHighRisk === 'yes' || m.isHighRisk === true),
            ancStatus: m.healthData?.ancStatus || (m.ancStatus === 'active' ? 'active' : 'none'),
          }
        }));
      }

      if (key === STORAGE_KEYS.FAMILIES && Array.isArray(data)) {
        return data.map(f => ({
          ...f,
          houseNo: f.houseNo || f.house || '',
          religionCaste: f.religionCaste || f.caste || '',
          isBPL: f.isBPL ?? (f.bpl === 'Yes' || f.bpl === 'yes'),
          villageId: f.villageId || f.village || ''
        }));
      }

      return data;
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
      console.log(`📝 SyncQueue: Queued SAVE for ${tableName} (id: ${payload?.id}) — total: ${updatedQueue.length}`);
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
      // 1. Add to Sync Queue
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
