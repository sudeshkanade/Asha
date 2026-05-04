import { storage, STORAGE_KEYS } from '../database/storage';

/**
 * ASHA Incentive Rates (Default Government Rates)
 */
export const DEFAULT_INCENTIVE_RATES = {
  ANC_REGISTRATION: 25,
  INSTITUTIONAL_DELIVERY: 300,
  FULL_IMMUNIZATION: 100,
  HBNC_VISIT: 50,
  VHND_SESSION: 200,
  NCD_SCREENING: 10,
};

/**
 * Load dynamic rates from storage, falling back to defaults.
 */
export const getActiveRates = async () => {
  try {
    const configItems = await storage.getAll(STORAGE_KEYS.APP_CONFIG);
    const ratesConfig = configItems.find(c => c.id === 'incentive_rates');
    if (ratesConfig && ratesConfig.rates) {
      return { ...DEFAULT_INCENTIVE_RATES, ...ratesConfig.rates };
    }
  } catch (e) {
    console.error('Error loading rates', e);
  }
  return DEFAULT_INCENTIVE_RATES;
};

/**
 * Calculate ASHA claims from activity data.
 * @param {Array} members - All registered members
 * @param {Array} events - Vital events (births, etc.)
 * @param {Object} rates - Incentive rates to use
 */
export const calculateClaims = (members, events, rates = DEFAULT_INCENTIVE_RATES) => {
  let totalEarnings = 0;
  const claimsList = [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Calculate from members (ANC, Immunization, NCD)
  members.forEach(m => {
    const health = m.healthData || {};
    const regDate = m.lastUpdatedAt ? new Date(m.lastUpdatedAt) : null;
    const isThisMonth = regDate && regDate.getMonth() === currentMonth && regDate.getFullYear() === currentYear;

    if (isThisMonth && health.edd) {
      totalEarnings += rates.ANC_REGISTRATION;
      claimsList.push({
        type: 'ANC Registration',
        member: `${m.firstName} ${m.lastName}`,
        amount: rates.ANC_REGISTRATION,
      });
    }

    if (isThisMonth && health.vaccinationStatus === 'Complete') {
      totalEarnings += rates.FULL_IMMUNIZATION;
      claimsList.push({
        type: 'Full Immunization',
        member: `${m.firstName} ${m.lastName}`,
        amount: rates.FULL_IMMUNIZATION,
      });
    }

    if (isThisMonth && m.age >= 30 && (health.bpSystolic || health.sugarLevel)) {
      totalEarnings += rates.NCD_SCREENING;
      claimsList.push({
        type: 'NCD Screening',
        member: `${m.firstName} ${m.lastName}`,
        amount: rates.NCD_SCREENING,
      });
    }
  });

  // 2. Calculate from events (Births, VHND)
  events.forEach(e => {
    const eventDate = e.timestamp ? new Date(e.timestamp) : null;
    const isThisMonth = eventDate && eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;

    if (e.tableName === 'vital_events' && e.payload?.type === 'Birth' && e.payload?.place === 'Hospital') {
      totalEarnings += rates.INSTITUTIONAL_DELIVERY;
      claimsList.push({
        type: 'Institutional Delivery',
        member: e.payload.name || 'Newborn',
        amount: rates.INSTITUTIONAL_DELIVERY,
      });
    }

    if (e.tableName === 'vhnd_sessions') {
      totalEarnings += rates.VHND_SESSION;
      claimsList.push({
        type: 'VHND Session',
        member: e.payload?.venue || 'Village Session',
        amount: rates.VHND_SESSION,
      });
    }
  });

  return {
    totalEarnings,
    claimsCount: claimsList.length,
    claimsList,
  };
};
