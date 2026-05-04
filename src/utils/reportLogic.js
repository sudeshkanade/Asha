/**
 * Advanced Reporting & Aggregation Logic
 * 
 * Events come from SYNC_QUEUE which stores items as:
 *   { tableName: 'vital_events'|'vhnd_sessions', payload: {...}, timestamp: ISO_string }
 * Members come from MEMBERS storage with standard fields + healthData.
 */

export const generateMPRStats = (members, events) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter helper: Only records from the current calendar month
  const isCurrentMonth = (dateStr) => {
    if (!dateStr) return false;
    const ts = typeof dateStr === 'number' ? dateStr : Date.parse(dateStr);
    if (isNaN(ts)) return false;
    const date = new Date(ts);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  };

  // 1. Maternal Stats
  const maternalStats = {
    newANC: 0,
    firstTrimesterANC: 0,
    severeAnemia: 0,
    highRiskTotal: 0,
    hospitalDeliveries: 0,
    homeDeliveries: 0,
  };

  members.forEach(m => {
    const health = m.healthData || {};

    // Count ANC registrations: check multiple ancStatus values for compatibility (B3)
    if (health.edd || health.ancStatus === 'active' || health.ancStatus === 'registered' || health.isPregnant) {
      maternalStats.newANC++;
      if (health.isHighRisk) maternalStats.highRiskTotal++;
      
      if (parseFloat(health.hbLevel) > 0 && parseFloat(health.hbLevel) < 7) {
        maternalStats.severeAnemia++;
      }
    }
  });

  // 2. Vital Events & Stock from Sync Queue
  const vitalStats = {
    births: 0,
    deaths: 0,
    infantDeaths: 0,
  };

  const stockStats = {
    ironDistributed: 0,
    orsDistributed: 0,
    condomsDistributed: 0,
  };

  events.forEach(e => {
    // Sync queue items have { tableName, payload, timestamp }
    const timestamp = e.timestamp;
    if (!isCurrentMonth(timestamp)) return;

    const payload = e.payload || e;

    // Vital events: births & deaths
    if (e.tableName === 'vital_events') {
      if (payload.type === 'Birth') {
        vitalStats.births++;
        if (payload.place === 'Hospital') maternalStats.hospitalDeliveries++;
        if (payload.place === 'Home') maternalStats.homeDeliveries++;
      }
      if (payload.type === 'Death') {
        vitalStats.deaths++;
        if (parseInt(payload.ageAtDeath) < 1) vitalStats.infantDeaths++;
      }
    }

    // VHND sessions: stock distribution
    if (e.tableName === 'vhnd_sessions') {
      stockStats.ironDistributed += parseInt(payload.ifaDistributed || 0);
      stockStats.orsDistributed += parseInt(payload.orsDistributed || 0);
      stockStats.condomsDistributed += parseInt(payload.condomsDistributed || 0);
    }
  });

  // 3. Child Health
  const mandatoryVaccines = ['BCG', 'Pentavalent 3', 'MR 1', 'OPV 3'];
  const childStats = {
    samChildren: members.filter(m => m.healthData?.malnutritionStatus === 'high_risk').length,
    fullyImmunized: members.filter(m => {
      const dob = new Date(m.dob);
      if (isNaN(dob.getTime())) return false;
      const ageInMonths = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
      if (ageInMonths < 12) return false;
      
      const memberVaccines = m.vaccines?.map(v => v.name) || [];
      return mandatoryVaccines.every(v => memberVaccines.includes(v));
    }).length,
  };

  // 4. NCD Screening
  const ncdStats = {
    screened: members.filter(m => {
      const age = parseInt(m.age);
      const health = m.healthData || {};
      return age >= 30 && (health.bpSystolic || health.sugarLevel);
    }).length,
  };

  // 5. Family Planning & EC
  const fpStats = {
    totalEC: 0,
    sterilization: 0,
    spacing: 0,
    none: 0,
  };

  members.forEach(m => {
    const age = parseInt(m.age);
    // FIX C1: Only count married females as EC, matching the EC register filter
    if (m.gender === 'Female' && age >= 15 && age <= 49 &&
        (m.maritalStatus === 'Married' || m.relationToHead === 'Wife' || m.relation === 'Wife' || m.relationToHead === 'Daughter-in-law')) {
      fpStats.totalEC++;
      const method = m.healthData?.fpMethod;
      if (method === 'permanent') fpStats.sterilization++;
      else if (method && method !== 'none') fpStats.spacing++;
      else fpStats.none++;
    }
  });

  // 6. Pending ANC (pregnant women not yet visited this month)
  const pendingANC = members.filter(m => {
    const health = m.healthData || {};
    return health.edd && !isCurrentMonth(m.lastUpdatedAt);
  }).length;

  return {
    maternal: { ...maternalStats, pendingANC },
    vital: vitalStats,
    stock: stockStats,
    child: childStats,
    ncd: ncdStats,
    fp: fpStats,
    monthName: now.toLocaleString('default', { month: 'long' }),
    year: currentYear
  };
};
