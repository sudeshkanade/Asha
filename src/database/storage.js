import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from './constants';
import { calculateAge } from '../utils/healthLogic';

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
    // BUG-1 FIX: When fn() throws, we must reset the lock chain to a resolved state
    // so subsequent callers are not blocked forever by the rejected promise.
    const next = storageLock.then(fn).catch((e) => {
      console.error('❌ Storage Lock Error:', e);
      // Re-throw so the caller of withLock still receives the error,
      // but the chain itself is reset because `.catch()` returns a resolved promise
      // that subsequent `.then()` calls can attach to normally.
      throw e;
    });
    // storageLock always points to a promise that resolves (never rejects)
    storageLock = next.catch(() => {});
    return next;
  },

  /**
   * Generate a globally unique ID (timestamp + user prefix + random)
   */
  generateId: (prefix = 'id', userId = 'unknown') => {
    // QUALITY-3 FIX: Use crypto.randomUUID() for cryptographically-secure IDs.
    // Falls back to Math.random() only on very old environments without crypto support.
    let entropy;
    try {
      entropy = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
        : Math.random().toString(36).slice(2, 11);
    } catch {
      entropy = Math.random().toString(36).slice(2, 11);
    }
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
   * Internal logic for getAll (no lock)
   */
  _getAll: async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      const parsed = value != null ? JSON.parse(value) : [];
      if (!Array.isArray(parsed)) return [];

      if (key === STORAGE_KEYS.MEMBERS) {
        let villages = [];
        let subCenters = [];
        try {
          const vValue = await AsyncStorage.getItem(STORAGE_KEYS.VILLAGES);
          villages = vValue ? JSON.parse(vValue) : [];
          const scValue = await AsyncStorage.getItem(STORAGE_KEYS.SUB_CENTERS);
          subCenters = scValue ? JSON.parse(scValue) : [];
        } catch (e) {}

        return parsed.map(m => {
          let villageId = m.villageId;
          let subCenterId = m.subCenterId;
          let phcId = m.phcId;

          if (!villageId && (m.village || m.villageName)) {
            const vName = (m.village || m.villageName).toLowerCase().trim();
            const matchedV = villages.find(v => v.name?.toLowerCase().trim() === vName);
            if (matchedV) {
              villageId = matchedV.id;
              subCenterId = subCenterId || matchedV.subCenterId;
            }
          }

          if (subCenterId && !phcId) {
            const matchedSC = subCenters.find(sc => sc.id === subCenterId);
            if (matchedSC) {
              phcId = matchedSC.phcId;
            }
          }

          const healthData = {
            isPregnant: m.healthData?.isPregnant ?? (m.isPregnant === 'yes' || m.isPregnant === true || false),
            isHighRisk: m.healthData?.isHighRisk ?? (m.isHighRisk === 'yes' || m.isHighRisk === true || false),
            hbLevel: m.healthData?.hbLevel ?? m.hbLevel ?? '',
            bpSystolic: m.healthData?.bpSystolic ?? m.bpSystolic ?? '',
            bpDiastolic: m.healthData?.bpDiastolic ?? m.bpDiastolic ?? '',
            sugarLevel: m.healthData?.sugarLevel ?? m.sugarLevel ?? '',
            muac: m.healthData?.muac ?? m.muac ?? '',
            fpMethod: m.healthData?.fpMethod ?? m.fpMethod ?? '',
            edd: m.healthData?.edd ?? m.edd ?? '',
            ancStatus: m.healthData?.ancStatus ?? m.ancStatus ?? '',
            tbScreening: m.healthData?.tbScreening ?? m.tbScreening ?? null,
            hasFeverWithChills: m.healthData?.hasFeverWithChills ?? m.hasFeverWithChills ?? false,
            hasSkinPatches: m.healthData?.hasSkinPatches ?? m.hasSkinPatches ?? false,
            ...(m.healthData || {})
          };

          // DATA-CLEAN-P2A: Normalize dob to YYYY-MM-DD (ISO) for consistent age/schedule calculations.
          // Excel imports often provide DD/MM/YYYY; JS `new Date("15/06/1990")` returns Invalid Date.
          let dob = m.dob;
          if (dob) {
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(dob))) {
              const [d, mo, y] = String(dob).split('/');
              dob = `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
            } else if (typeof dob === 'number') {
              dob = new Date(dob).toISOString().split('T')[0];
            }
          }

          return {
            ...m,
            firstName: m.firstName || m.fname || '',
            lastName: m.lastName || m.lname || '',
            dob,
            villageId,
            subCenterId,
            phcId,
            healthData
          };
        });
      }

      if (key === STORAGE_KEYS.FAMILIES) {
        let villages = [];
        try {
          const vValue = await AsyncStorage.getItem(STORAGE_KEYS.VILLAGES);
          villages = vValue ? JSON.parse(vValue) : [];
        } catch (e) {}

        return parsed.map(f => {
          let villageId = f.villageId;
          let subCenterId = f.subCenterId;
          let phcId = f.phcId;

          if (!villageId && (f.village || f.villageName)) {
            const vName = (f.village || f.villageName).toLowerCase().trim();
            const matchedV = villages.find(v => v.name?.toLowerCase().trim() === vName);
            if (matchedV) {
              villageId = matchedV.id;
              subCenterId = subCenterId || matchedV.subCenterId;
            }
          }

          return {
            ...f,
            villageId,
            subCenterId,
            phcId
          };
        });
      }

      return parsed;
    } catch (e) {
      return [];
    }
  },

  /**
   * Internal logic for saveAll (no lock)
   */
  _saveAll: async (key, items) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(items));
      return true;
    } catch (e) {
      console.error('❌ Storage._saveAll error:', e);
      return false;
    }
  },

  /**
   * Internal logic for update (no lock)
   */
  _update: async (tableName, updateFn) => {
    const currentData = await storage._getAll(tableName);
    const newData = updateFn(currentData);
    if (!newData) return null; 
    await storage._saveAll(tableName, newData);
    return newData;
  },

  /**
   * Internal logic for addToSyncQueue (no lock)
   */
  _addToSyncQueue: async (tableName, payload, type = 'save') => {
    return await storage._update(STORAGE_KEYS.SYNC_QUEUE, (queue) => {
      const syncItem = {
        id: storage.generateId('sync'),
        tableName,
        docId: payload.id,
        payload,
        type,
        timestamp: Date.now()
      };
      if (type === 'save') {
        // Upsert: replace existing save entry for same doc to avoid duplicates
        const existingIdx = queue.findIndex(q => q.docId === payload.id && q.tableName === tableName && q.type === 'save');
        if (existingIdx >= 0) {
          queue[existingIdx] = syncItem;
          return queue;
        }
      } else if (type === 'delete') {
        // SYNC-4 FIX: Deduplicate delete operations — only keep the latest
        const existingDeleteIdx = queue.findIndex(q => q.docId === payload.id && q.tableName === tableName && q.type === 'delete');
        if (existingDeleteIdx >= 0) {
          queue[existingDeleteIdx] = syncItem;
          return queue;
        }
        // Also remove any pending save for this doc — a delete supersedes it
        const pendingSaveIdx = queue.findIndex(q => q.docId === payload.id && q.tableName === tableName && q.type === 'save');
        if (pendingSaveIdx >= 0) {
          queue.splice(pendingSaveIdx, 1);
        }
      }
      queue.push(syncItem);
      return queue;
    });
  },

  /**
   * Save a record with Conflict Resolution (Last-Write-Wins)
   */
  save: async (key, data) => {
    return storage.withLock(async () => {
      try {
        const existingData = await storage._getAll(key);
        const timestamp = new Date().getTime();
        
        let normalizedData = { ...data };
        if (key === STORAGE_KEYS.MEMBERS) {
          // P3-A: Strip legacy fname/lname aliases so records don't accumulate duplicate fields
          const { fname, lname, ...rest } = normalizedData;
          normalizedData = {
            ...rest,
            firstName: rest.firstName || fname || '',
            lastName: rest.lastName || lname || '',
            // P3-B: Keep relation and relationToHead in sync so both exist for all report filters
            relationToHead: rest.relation || rest.relationToHead || '',
            // P3-C: Embed timestamp in healthData so field-level merge comparisons are meaningful
            healthData: {
              ...(rest.healthData || {}),
              isPregnant: rest.healthData?.isPregnant ?? (rest.isPregnant === 'yes' || rest.isPregnant === true),
              lastUpdatedAt: timestamp,
            }
          };
        }

        const newData = { 
          ...normalizedData, 
          id: normalizedData.id || storage.generateId(key.replace('@rural_health_', '').slice(0, 3), normalizedData.ashaId || 'sys'), 
          syncStatus: 'pending',
          lastUpdatedAt: timestamp 
        };

        const tombstones = await storage._getAll(STORAGE_KEYS.DELETED_IDS);
        if (tombstones.includes(newData.id.toString())) {
          const updatedTombstones = tombstones.filter(id => id !== newData.id.toString());
          await storage._saveAll(STORAGE_KEYS.DELETED_IDS, updatedTombstones);
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

        await storage._addToSyncQueue(key, newData);
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
        // BUG-STATE-02 FIX: use Math.max(0,...) to prevent negative counters on concurrent updates
        summary.totalMembers = Math.max(0, summary.totalMembers - 1);
        if (oldData.healthData?.isPregnant) summary.totalPregnant = Math.max(0, summary.totalPregnant - 1);
        if (oldData.healthData?.isHighRisk) summary.totalHighRisk = Math.max(0, summary.totalHighRisk - 1);
        if ((parseInt(oldData.age) || 0) < 5) summary.totalChildren = Math.max(0, summary.totalChildren - 1);
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
    return storage.withLock(async () => {
      // P3-D: Filter tombstoned IDs for clinical collections to prevent cloud resurrection of deleted records
      const clinicalKeys = [STORAGE_KEYS.MEMBERS, STORAGE_KEYS.FAMILIES, STORAGE_KEYS.VITAL_EVENTS];
      let cleanedItems = items;
      if (Array.isArray(items) && clinicalKeys.includes(key)) {
        const tombstones = await storage._getAll(STORAGE_KEYS.DELETED_IDS);
        if (tombstones.length > 0) {
          const tombstoneSet = new Set(tombstones.map(String));
          cleanedItems = items.filter(item => !item.id || !tombstoneSet.has(String(item.id)));
        }
      }
      return await storage._saveAll(key, cleanedItems);
    });
  },

  /**
   * P2-D: Recompute PHC_SUMMARY from scratch by counting actual members.
   * Call this after cloud sync merges to fix counter drift.
   */
  recomputeSummary: async () => {
    try {
      const members = await storage._getAll(STORAGE_KEYS.MEMBERS);
      // DATA-4 FIX: Only count living, non-deleted active members in denominators
      const activeMembers = members.filter(m => m.status !== 'Deceased' && !m.isDeleted);
      const summary = {
        totalMembers: activeMembers.length,
        totalPregnant: activeMembers.filter(m => m.healthData?.isPregnant).length,
        totalHighRisk: activeMembers.filter(m => m.healthData?.isHighRisk).length,
        // Use DOB-computed age for accuracy instead of the stale stored age field
        totalChildren: activeMembers.filter(m => {
          if (m.dob) {
            const age = calculateAge(m.dob);
            return !isNaN(age) && age >= 0 && age < 5;
          }
          return (parseInt(m.age) || 99) < 5;
        }).length,
      };
      await AsyncStorage.setItem('PHC_SUMMARY', JSON.stringify(summary));
      console.log('✅ PHC_SUMMARY recomputed:', summary);
    } catch (e) {
      console.error('❌ recomputeSummary Error:', e);
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
    
    let assignedIds = new Set();
    if (user.role === 'ASHA') {
      const assigned = user.assignedVillages || [];
      assigned.forEach(v => {
        if (typeof v === 'string') assignedIds.add(v);
        else if (v && typeof v === 'object') assignedIds.add(v.id || v.villageId);
      });
      if (user.villageId) assignedIds.add(user.villageId);
    }

    for (const key of collectionsToCheck) {
      const data = await storage.getAll(key);
      const filtered = data.filter(item => {
        // Safety: never purge records with no hierarchy ID (pending sync or local-only)
        const hasNoId = !item.villageId && !item.subCenterId && !item.phcId;
        if (hasNoId) return true;

        return (user.role === 'ASHA' && (assignedIds.has(item.villageId) || item.ashaId === user.id || !item.villageId)) ||
               (['ANM', 'MPW', 'CHO'].includes(user.role) && (
                 item.subCenterId === user.subCenterId ||
                 // BUG-PURGE-01: Preserve ASHA-registered records (have ashaId but may lack subCenterId)
                 !!item.ashaId
               )) ||
               (user.role === 'MO' && (item.phcId === user.phcId || !!item.ashaId));
      });

      // P2-E: Always write back normalized data, not only when records are deleted.
      // This persists resolved subCenterId/phcId for Excel-imported records that had
      // those fields missing in raw storage but resolved via village lookup in _getAll.
      await storage.saveAll(key, filtered);
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
          // BUG-4 FIX: Some keys (e.g. PHC_SUMMARY) store a plain object, not an array.
          // Calling .filter() on a non-array throws TypeError and crashes on every app boot.
          if (!Array.isArray(data)) continue;
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
      return await storage._update(tableName, updateFn);
    });
  },

  getAll: async (key) => {
    return await storage._getAll(key);
  },

  addToSyncQueue: async (tableName, payload, type = 'save') => {
    return await storage.withLock(async () => {
      return await storage._addToSyncQueue(tableName, payload, type);
    });
  },

  /**
   * Internal logic for addToDeleteQueue (no lock)
   */
  _addToDeleteQueue: async (tableName, id) => {
    if (!id) return;
    if (tableName === STORAGE_KEYS.MEMBERS) {
      const dependentKeys = [STORAGE_KEYS.VITAL_EVENTS, STORAGE_KEYS.CLAIMS, STORAGE_KEYS.TASK_COMPLETIONS];
      for (const depKey of dependentKeys) {
        await storage._update(depKey, (data) => data.filter(item => item.memberId !== id && item.id !== id));
      }
    }
    if (tableName === STORAGE_KEYS.FAMILIES) {
      const memberData = await storage._getAll(STORAGE_KEYS.MEMBERS);
      const membersToDelete = memberData.filter(m => m.familyId === id);
      for (const member of membersToDelete) {
        await storage._addToDeleteQueue(STORAGE_KEYS.MEMBERS, member.id);
      }
    }
    await storage._addToSyncQueue(tableName, { id }, 'delete');
    
    // Add to local tombstones
    await storage._update(STORAGE_KEYS.DELETED_IDS, (tombstones) => {
      if (!tombstones.includes(id.toString())) {
        return [...tombstones, id.toString()];
      }
      return tombstones;
    });
  },

  addToDeleteQueue: async (tableName, id) => {
    return await storage.withLock(async () => {
      return await storage._addToDeleteQueue(tableName, id);
    });
  },

  init: async () => {
     // Initialization logic if needed (e.g. creating default config)
     return true;
  },

  clearAll: async () => {
    await AsyncStorage.clear();
  },

  /**
   * Alias for clearAll — used by LoginScreen factory reset & cloud wipe flows.
   * Wipes ALL local AsyncStorage data.
   */
  wipeAllData: async () => {
    await AsyncStorage.clear();
  },
};
