import { storage } from '../database/storage';

export class MemberPayload {
  constructor(data, existingMember = null, user = null, familyHead = null) {
    this.id = existingMember?.id || storage.generateId('mem', user?.id || 'sys');
    
    // Core Identity
    this.firstName = String(data.firstName || '').trim();
    this.middleName = String(data.middleName || '').trim();
    this.lastName = String(data.lastName || '').trim();
    this.relationToHead = String(data.relationToHead || data.relation || 'Other');
    
    // Demographics
    this.dob = String(data.dob || ''); // Format: YYYY-MM-DD expected, or DD/MM/YYYY internally translated
    this.age = data.age !== undefined && data.age !== null ? Number(data.age) : null;
    this.gender = String(data.gender || 'Female');
    this.maritalStatus = String(data.maritalStatus || 'Unmarried');
    this.education = String(data.education || 'none');
    
    // Identifiers
    this.aadhaar = String(data.aadhaar || '').trim();
    this.abhaId = String(data.abhaId || '').trim();
    this.phone = String(data.phone || '').trim();
    
    // Boolean Flags
    this.isPwd = Boolean(data.isPwd);
    this.isMigrant = Boolean(data.isMigrant);
    
    // Hierarchy & Sync Scope (Carry over from existing, familyHead, or user)
    this.familyId = existingMember?.familyId || familyHead?.id || data.familyId || null;
    this.villageId = existingMember?.villageId || familyHead?.villageId || user?.villageId || null;
    this.subCenterId = existingMember?.subCenterId || familyHead?.subCenterId || user?.subCenterId || null;
    this.phcId = existingMember?.phcId || familyHead?.phcId || user?.phcId || null;
    this.ashaId = existingMember?.ashaId || familyHead?.ashaId || user?.id || null;
    
    // Name denormalization for easier querying
    this.villageName = existingMember?.villageName || familyHead?.villageName || data.villageName || null;
    
    // System Data
    this.createdAt = existingMember?.createdAt || Date.now();
    this.lastUpdatedAt = Date.now();
    this.syncStatus = 'pending';
    
    // Health Data Envelope
    const prevHealth = existingMember?.healthData || {};
    const newHealth = data.healthData || {};
    this.healthData = {
      ...prevHealth,
      isPregnant: Boolean(newHealth.hasOwnProperty('isPregnant') ? newHealth.isPregnant : prevHealth.isPregnant),
      hasNcd: Boolean(newHealth.hasOwnProperty('hasNcd') ? newHealth.hasNcd : prevHealth.hasNcd),
      lmp: (newHealth.hasOwnProperty('isPregnant') ? newHealth.isPregnant : prevHealth.isPregnant) ? String(newHealth.lmp || prevHealth.lmp || '') : '',
      edd: (newHealth.hasOwnProperty('isPregnant') ? newHealth.isPregnant : prevHealth.isPregnant) ? String(newHealth.edd || prevHealth.edd || '') : '',
      ancStatus: (newHealth.hasOwnProperty('isPregnant') ? newHealth.isPregnant : prevHealth.isPregnant) ? String(newHealth.ancStatus || prevHealth.ancStatus || 'active') : 'none',
      completedTasks: Array.isArray(newHealth.completedTasks) ? newHealth.completedTasks : (prevHealth.completedTasks || [])
    };
  }

  // Convert to plain JSON object for AsyncStorage
  toJSON() {
    return Object.assign({}, this);
  }
}
