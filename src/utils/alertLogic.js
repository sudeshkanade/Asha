import { storage, STORAGE_KEYS } from '../database/storage';

/**
 * Generate and save an alert for the supervisory hierarchy.
 * @param {Object} alertData - The alert configuration.
 * @param {string} alertData.type - Type of alert (e.g., 'HIGH_RISK_ANC', 'SAM_CHILD', 'TB_SUSPECT', 'MORTALITY', 'STOCK_INDENT').
 * @param {string} alertData.message - Human-readable alert message.
 * @param {string} alertData.severity - Severity level ('High', 'Critical').
 * @param {Array<string>} alertData.targetRoles - Roles that should see this alert (e.g., ['ANM', 'MPW', 'CHO', 'MO']).
 * @param {Object} user - The user generating the alert (typically ASHA).
 * @param {string} [alertData.memberId] - Optional associated member ID.
 * @returns {Promise<boolean>} - True if saved successfully.
 */
export const generateAlert = async ({ type, message, severity = 'High', targetRoles = ['ANM', 'CHO', 'MO'], user, memberId = null }) => {
  try {
    if (!user) {
      console.warn('generateAlert called without user object');
      return false;
    }

    const newAlert = {
      id: storage.generateId('alt', user.id || 'sys'),
      type,
      message,
      severity,
      targetRoles,
      sourceUserId: user.id,
      sourceUserName: user.name,
      villageId: user.villageId,
      subCenterId: user.subCenterId,
      phcId: user.phcId,
      memberId,
      timestamp: new Date().toISOString(),
      status: 'Unread', // Can be toggled to 'Acknowledged' by ANM
    };

    await storage.save(STORAGE_KEYS.ALERTS, newAlert);
    return true;
  } catch (error) {
    console.error('Failed to generate alert:', error);
    return false;
  }
};
