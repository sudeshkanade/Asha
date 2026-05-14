import { storage, STORAGE_KEYS } from '../database/storage';
import { DEFAULT_INCENTIVE_RATES, getActiveRates } from './claimsLogic';

/**
 * Incentive Manager - Ensures atomic, unique, and traceable ASHA incentives.
 * Prevents double-claiming and provides an audit trail for all payments.
 */
export const incentiveManager = {
  /**
   * Generate a unique key for a claim to prevent duplicates
   */
  generateClaimKey: (memberId, activityType, month, year) => {
    return `${memberId}_${activityType}_${month}_${year}`.toUpperCase();
  },

  /**
   * Process and record a new incentive claim
   */
  recordClaim: async (member, activityType, user) => {
    if (!member || !user) return null;

    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();
    const claimKey = incentiveManager.generateClaimKey(member.id, activityType, month, year);

    // 1. Check if this specific claim already exists for this period
    const existingClaims = await storage.getAll(STORAGE_KEYS.CLAIMS);
    if (existingClaims.some(c => c.claimKey === claimKey)) {
      console.log(`Incentive: Duplicate claim detected for ${claimKey}. Skipping.`);
      return null;
    }

    // 2. Get active rates
    const rates = await getActiveRates();
    const amount = rates[activityType] || 0;

    if (amount <= 0) return null;

    // 3. Create the claim record
    const claim = {
      id: storage.generateId('CLM', user.id),
      claimKey,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      villageId: member.villageId || user.villageId,
      ashaId: user.id,
      activityType,
      amount,
      status: 'pending',
      month,
      year,
      timestamp: Date.now(),
      syncStatus: 'pending'
    };

    // 4. Atomic Save
    await storage.save(STORAGE_KEYS.CLAIMS, claim);
    console.log(`Incentive: Atomic claim generated for ${member.firstName} - ${activityType} (₹${amount})`);
    return claim;
  },

  /**
   * Trigger claims based on member health data updates
   */
  processMemberTriggers: async (member, user) => {
    if (!member || !user || user.role !== 'ASHA') return;

    const health = member.healthData || {};
    
    // Trigger 1: ANC Registration
    if (health.lmp && health.edd) {
      await incentiveManager.recordClaim(member, 'ANC_REGISTRATION', user);
    }

    // Trigger 2: Full Immunization
    if (health.vaccinationStatus === 'Complete') {
      await incentiveManager.recordClaim(member, 'FULL_IMMUNIZATION', user);
    }

    // Trigger 3: NCD Screening (Age 30+)
    if ((parseInt(member.age) || 0) >= 30 && (health.bpSystolic || health.sugarLevel)) {
      await incentiveManager.recordClaim(member, 'NCD_SCREENING', user);
    }
  },

  /**
   * Trigger claims based on vital events
   * Note: This receives the saved event/session object directly (not a sync-queue item).
   */
  processEventTriggers: async (event, user) => {
    if (!event || !user || user.role !== 'ASHA') return;

    // Trigger 4: Institutional Delivery
    // FIX: event is the vital event object itself — use event.type and event.place directly
    if (event.type === 'Birth' && event.place === 'Hospital') {
       const mockMember = { 
         id: event.id, 
         firstName: event.name || 'Newborn', 
         lastName: '', 
         villageId: event.villageId || user.villageId 
       };
       await incentiveManager.recordClaim(mockMember, 'INSTITUTIONAL_DELIVERY', user);
    }

    // Trigger 5: VHND Session
    // FIX: VHND session objects have event.type === 'VHND', not event.tableName
    if (event.type === 'VHND') {
       const mockMember = { 
         id: event.id, 
         firstName: 'VHND', 
         lastName: event.venue || 'Session', 
         villageId: event.villageId || user.villageId 
       };
       await incentiveManager.recordClaim(mockMember, 'VHND_SESSION', user);
    }
  }
};
