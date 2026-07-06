import { storage, STORAGE_KEYS } from '../database/storage';
import { calculateAge } from './healthLogic';

export const DataRecoveryManager = {
  runHeal: async (user) => {
    if (!user) return;

    try {
      const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
      const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
      const familyIds = new Set(allFamilies.map(f => f.id));
      
      let familiesUpdated = false;
      const updatedFamilies = allFamilies.map(f => {
        let changed = false;
        const updatedF = { ...f };
        if (!updatedF.villageId && user.villageId) {
          updatedF.villageId = user.villageId;
          changed = true;
        }
        if (!updatedF.ashaId && user.id) {
          updatedF.ashaId = user.id;
          changed = true;
        }
        if (changed) familiesUpdated = true;
        return changed ? updatedF : f;
      });

      if (familiesUpdated) {
        await storage._saveAll(STORAGE_KEYS.FAMILIES, updatedFamilies);
      }

      let membersUpdated = false;
      const updatedMembers = allMembers.map(m => {
        let changed = false;
        const updatedM = { ...m };

        // 1. Heal Age and DOB
        if (!updatedM.dob || updatedM.dob === 'NaN-NaN-NaN' || updatedM.dob === 'undefined-undefined-undefined') {
          if (updatedM.age !== undefined && updatedM.age !== null && !isNaN(updatedM.age)) {
            // Infer DOB from age
            const inferredYear = new Date().getFullYear() - parseInt(updatedM.age);
            updatedM.dob = `${inferredYear}-01-01`;
            changed = true;
          }
        }
        
        if (updatedM.age === undefined || updatedM.age === null || isNaN(updatedM.age) || updatedM.age < 0) {
          if (updatedM.dob && updatedM.dob !== 'NaN-NaN-NaN') {
            updatedM.age = calculateAge(updatedM.dob);
            changed = true;
          } else {
            // Unrecoverable age, default to 0
            updatedM.age = 0;
            updatedM.dob = `${new Date().getFullYear()}-01-01`;
            changed = true;
          }
        }

        // 2. Heal Geographic Identifiers
        if (!updatedM.villageId && user.villageId) {
          updatedM.villageId = user.villageId;
          changed = true;
        }
        if (!updatedM.ashaId && user.id) {
          updatedM.ashaId = user.id;
          changed = true;
        }

        // 3. Heal Orphaned Members
        if (!updatedM.familyId || !familyIds.has(updatedM.familyId)) {
          // If the family doesn't exist, we assign them to a system recovery family or just clear it.
          // For now, we set it to a special "RECOVERY" family ID so it doesn't break filters expecting a valid string.
          updatedM.familyId = `RECOVERY_FAM_${user.id}`;
          changed = true;
        }

        if (changed) {
          updatedM.lastUpdatedAt = Date.now();
          // Only re-queue for sync if it hasn't been successfully synced yet.
          // Avoids flooding the sync queue with already-synced records every time heal runs.
          if (updatedM.syncStatus !== 'synced') {
            updatedM.syncStatus = 'pending';
          }
          membersUpdated = true;
        }
        return changed ? updatedM : m;
      });

      if (membersUpdated) {
        // Also create the RECOVERY family if it doesn't exist and there are orphans
        const hasOrphans = updatedMembers.some(m => m.familyId === `RECOVERY_FAM_${user.id}`);
        if (hasOrphans && !familyIds.has(`RECOVERY_FAM_${user.id}`)) {
          const recoveryFamily = {
            id: `RECOVERY_FAM_${user.id}`,
            headName: 'System Recovery Family',
            villageId: user.villageId,
            ashaId: user.id,
            houseNo: 'REC-001',
            status: 'Active',
            createdAt: Date.now(),
            lastUpdatedAt: Date.now(),
            syncStatus: 'pending' // New record — always needs to sync
          };
          updatedFamilies.push(recoveryFamily);
          await storage._saveAll(STORAGE_KEYS.FAMILIES, updatedFamilies);
        }

        await storage._saveAll(STORAGE_KEYS.MEMBERS, updatedMembers);
      }

      console.log('✅ DataRecoveryManager: Self-healing complete.');
    } catch (e) {
      console.error('❌ DataRecoveryManager Error:', e);
    }
  }
};
