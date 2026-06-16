/**
 * Advanced Reporting & Aggregation Logic
 * 
 * Events come from SYNC_QUEUE which stores items as:
 *   { tableName: 'vital_events'|'vhnd_sessions', payload: {...}, timestamp: ISO_string }
 * Members come from MEMBERS storage with standard fields + healthData.
 */

export const generateMPRStats = (members, vitalEvents = [], vhndSessions = [], pendingEvents = [], selectedMonth = null, selectedYear = null) => {
  const now = new Date();
  const currentMonth = selectedMonth !== null ? selectedMonth : now.getMonth();
  const currentYear = selectedYear !== null ? selectedYear : now.getFullYear();

  // Filter helper: Only records from the selected calendar month and year
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
    activeANC: 0,
    firstTrimesterANC: 0,
    severeAnemia: 0,
    highRiskTotal: 0,
    activeHighRisk: 0,
    hospitalDeliveries: 0,
    homeDeliveries: 0,
  };

  members.forEach(m => {
    const health = m.healthData || {};
    const isPregnantRecord = health.edd || health.ancStatus === 'active' || health.ancStatus === 'registered' || health.isPregnant;

    if (isPregnantRecord) {
      maternalStats.activeANC++;
      if (health.isHighRisk) maternalStats.activeHighRisk++;
      
      // LOGIC-3 FIX: newANC should count registrations THIS reporting month, not all-time.
      // Previously every currently-pregnant woman was counted as "new" every month,
      // inflating the NHM indicator. Now we check ancRegistrationDate first,
      // falling back to health.lastUpdatedAt (when the ANC record was last modified).
      const registrationDate = health.ancRegistrationDate || health.lastUpdatedAt;
      if (isCurrentMonth(registrationDate)) {
        maternalStats.newANC++;
        if (health.isHighRisk) maternalStats.highRiskTotal++; // Monthly for MPR Report
      }
      if (parseFloat(health.hbLevel) > 0 && parseFloat(health.hbLevel) < 7) {
        maternalStats.severeAnemia++;
      }
    }
  });

  // 2. Vital Events & Stock from persistent storage + pending queue
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

  // Process persistent Vital Events
  vitalEvents.forEach(e => {
    if (!isCurrentMonth(e.date || e.timestamp)) return;
    if (e.type === 'Birth') {
      vitalStats.births++;
      if (e.place === 'Hospital') maternalStats.hospitalDeliveries++;
      if (e.place === 'Home') maternalStats.homeDeliveries++;
    }
    if (e.type === 'Death') {
      vitalStats.deaths++;
      if (parseInt(e.ageAtDeath) < 1) vitalStats.infantDeaths++;
    }
  });

  // Process persistent VHND Sessions
  vhndSessions.forEach(e => {
    if (!isCurrentMonth(e.sessionDate || e.timestamp)) return;
    stockStats.ironDistributed += parseInt(e.ifaDistributed || 0);
    stockStats.orsDistributed += parseInt(e.orsDistributed || 0);
    stockStats.condomsDistributed += parseInt(e.condomsDistributed || 0);
  });

  // Process Pending Events in Sync Queue (to show real-time changes before sync)
  pendingEvents.forEach(e => {
    const timestamp = e.timestamp;
    if (!isCurrentMonth(timestamp)) return;
    const payload = e.payload || e;

    if (e.tableName === 'vital_events' || e.tableName === '@rural_health_vital_events') {
      // Avoid double counting if already in persistent storage
      if (vitalEvents.some(ve => ve.id === payload.id)) return;
      
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

    if (e.tableName === 'vhnd_sessions' || e.tableName === '@rural_health_vhnd') {
      if (vhndSessions.some(vs => vs.id === payload.id)) return;
      stockStats.ironDistributed += parseInt(payload.ifaDistributed || 0);
      stockStats.orsDistributed += parseInt(payload.orsDistributed || 0);
      stockStats.condomsDistributed += parseInt(payload.condomsDistributed || 0);
    }
  });

  // 3. Child Health
  const mandatoryVaccines = ['BCG', 'Pentavalent 3', 'MR 1', 'OPV 3'];
  const childStats = {
    samChildren: members.filter(m => {
      const age = parseInt(m.age);
      const muac = parseFloat(m.healthData?.muac || 0);
      return age <= 5 && muac > 0 && muac < 11.5;
    }).length,
    mamChildren: members.filter(m => {
      const age = parseInt(m.age);
      const muac = parseFloat(m.healthData?.muac || 0);
      return age <= 5 && muac >= 11.5 && muac < 12.5;
    }).length,
    fullyImmunized: members.filter(m => {
      const dobStr = m.dob;
      if (!dobStr) return false;
      const dob = new Date(dobStr);
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

  // 4.5 Disease Surveillance
  const diseaseStats = {
    tbSuspects: members.filter(m => {
      const tb = m.healthData?.tbScreening;
      return tb?.hasCoughTwoWeeks || (tb?.hasFever && tb?.hasWeightLoss);
    }).length,
    malariaSuspects: members.filter(m => m.healthData?.hasFeverWithChills).length,
    leprosySuspects: members.filter(m => m.healthData?.hasSkinPatches).length,
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
    if (m.gender === 'Female' && age >= 15 && age <= 49 &&
        (m.maritalStatus === 'Married' || m.relationToHead === 'Wife' || m.relation === 'Wife' || m.relationToHead === 'Daughter-in-law')) {
      fpStats.totalEC++;
      const method = m.healthData?.fpMethod;
      if (method === 'permanent') fpStats.sterilization++;
      else if (method && method !== 'none') fpStats.spacing++;
      else fpStats.none++;
    }
  });

  // 6. Pending ANC (pregnant women not yet updated/visited this month)
  // LOGIC-4 FIX: Use health.lastUpdatedAt (the ANC record's own timestamp) rather than
  // m.lastUpdatedAt (the member record's timestamp). This correctly identifies pregnant
  // women whose ANC data hasn't been recorded this month, not just members not edited.
  const pendingANC = members.filter(m => {
    const health = m.healthData || {};
    return health.edd && !isCurrentMonth(health.lastUpdatedAt || m.lastUpdatedAt);
  }).length;

  return {
    maternal: { ...maternalStats, pendingANC },
    vital: vitalStats,
    stock: stockStats,
    child: childStats,
    ncd: ncdStats,
    disease: diseaseStats,
    fp: fpStats,
    monthName: new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }),
    year: currentYear
  };
};
