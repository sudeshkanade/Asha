import AsyncStorage from '@react-native-async-storage/async-storage';
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
  APP_CONFIG: 'asha_app_config',
  LOCKED_PERIODS: 'asha_locked_periods',
  VILLAGES: '@rural_health_villages',
  USERS: '@rural_health_users',
  PHCS: '@rural_health_phcs',
  SUB_CENTERS: '@rural_health_subcenters',
  VHND_SESSIONS: '@rural_health_vhnd',
  VITAL_EVENTS: '@rural_health_vital_events',
};

export const storage = {
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
        id: data.id || Date.now().toString(), 
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
      await storage.addToSyncQueue(key, newData);
      return true;
    } catch (e) {
      console.error('Error saving data', e);
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
      console.error('Error in saveAll', e);
      return false;
    }
  },

  /**
   * Get all records for a collection
   */
  getAll: async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value != null ? JSON.parse(value) : [];
    } catch (e) {
      console.error('Error getting data', e);
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
        timestamp: new Date().toISOString() 
      }];
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updatedQueue));
    } catch (e) {
      console.error('Sync Queue Error', e);
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
      console.error('Error wiping data', e);
      return false;
    }
  }
};
