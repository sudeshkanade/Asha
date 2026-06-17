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
        if (!f.villageId && user.villageId) {
          f.villageId = user.villageId;
          changed = true;
        }
        if (!f.ashaId && user.id) {
          f.ashaId = user.id;
          changed = true;
        }
        if (changed) familiesUpdated = true;
        return f;
      });

      if (familiesUpdated) {
        await storage._saveAll(STORAGE_KEYS.FAMILIES, updatedFamilies);
      }

      let membersUpdated = false;
      const updatedMembers = allMembers.map(m => {
        let changed = false;

        // 1. Heal Age and DOB
        if (!m.dob || m.dob === 'NaN-NaN-NaN' || m.dob === 'undefined-undefined-undefined') {
          if (m.age !== undefined && m.age !== null && !isNaN(m.age)) {
            // Infer DOB from age
            const inferredYear = new Date().getFullYear() - parseInt(m.age);
            m.dob = `${inferredYear}-01-01`;
            changed = true;
          }
        }
        
        if (m.age === undefined || m.age === null || isNaN(m.age) || m.age < 0) {
          if (m.dob && m.dob !== 'NaN-NaN-NaN') {
            m.age = calculateAge(m.dob);
            changed = true;
          } else {
            // Unrecoverable age, default to 0
            m.age = 0;
            m.dob = `${new Date().getFullYear()}-01-01`;
            changed = true;
          }
        }

        // 2. Heal Geographic Identifiers
        if (!m.villageId && user.villageId) {
          m.villageId = user.villageId;
          changed = true;
        }
        if (!m.ashaId && user.id) {
          m.ashaId = user.id;
          changed = true;
        }

        // 3. Heal Orphaned Members
        if (!m.familyId || !familyIds.has(m.familyId)) {
          // If the family doesn't exist, we assign them to a system recovery family or just clear it.
          // For now, we set it to a special "RECOVERY" family ID so it doesn't break filters expecting a valid string.
          m.familyId = `RECOVERY_FAM_${user.id}`;
          changed = true;
        }

        if (changed) {
          m.lastUpdatedAt = Date.now();
          m.syncStatus = 'pending';
          membersUpdated = true;
        }
        return m;
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
            syncStatus: 'pending'
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
