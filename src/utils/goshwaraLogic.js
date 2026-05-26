/**
 * Goshwara Aggregation Logic
 * Compiles individual records into SC-level abstract counts.
 */
export const generateGoshwaraReport = (members, vitalEvents = [], vhndSessions = [], pendingEvents = [], month, year) => {
  // Handle old signature calls (members, events, month, year) for backward compatibility
  let actualVitalEvents = vitalEvents;
  let actualVhndSessions = vhndSessions;
  let actualPendingEvents = pendingEvents;
  let actualMonth = month;
  let actualYear = year;

  if (typeof vhndSessions === 'number') {
    actualVitalEvents = [];
    actualVhndSessions = [];
    actualPendingEvents = vitalEvents || [];
    actualMonth = vhndSessions;
    actualYear = pendingEvents;
  }

  const stats = {
    maternal: {
      mh01_newANC: 0,
      mh02_earlyANC: 0,
      mh03_tdDoses: 0,
      mh04_anc4: 0,
      mh05_hrpIdentified: 0,
      mh06_severeAnemia: 0,
      mh07_ifa180: 0,
    },
    delivery: {
      dl01_instPublic: 0,
      dl02_instPrivate: 0,
      dl03_homeSkilled: 0,
      dl04_homeUnskilled: 0,
      dl05_liveBirthM: 0,
      dl06_liveBirthF: 0,
      dl07_stillBirths: 0,
      dl09_pnc48hr: 0,
    },
    child: {
      ch01_weighed: 0,
      ch02_lbw: 0,
      ch03_bfInitiated: 0,
      ch04_bcg: 0,
      ch05_penta3: 0,
      ch06_mr1: 0,
      ch07_fullyImm_M: 0,
      ch08_fullyImm_F: 0,
      ch11_samReferral: 0,
    },
    vital: {
      vs01_neonatalDeath: 0,
      vs02_infantDeath: 0,
      vs03_childDeath: 0,
      vs04_maternalDeath: 0,
      vs05_adultDeath: 0,
    },
    demographics: {
      age_0_12m: { m: 0, f: 0 },
      age_13_24m: { m: 0, f: 0 },
      age_5_6y: { m: 0, f: 0 },
      age_10_11y: { m: 0, f: 0 },
      age_16_17y: { m: 0, f: 0 },
      age_17_19y: { m: 0, f: 0 },
      age_40_60y: { m: 0, f: 0 },
      age_60plus: { m: 0, f: 0 },
    },
    fp: {
      fp01_tubectomy: 0,
      fp02_vasectomy: 0,
      fp03_iucd: 0,
      fp05_ocp: 0,
      fp06_condoms: 0,
    }
  };

  const drillDown = {
    mh05_hrpIdentified: [],
    mh06_severeAnemia: [],
    vs04_maternalDeath: [],
    ch11_samReferral: [],
  };

  const isMonthYear = (dateStr, m, y) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    return (d.getMonth() + 1) === m && d.getFullYear() === y;
  };

  // 1. Process Members
  members.forEach(m => {
    const health = m.healthData || {};
    const genderKey = m.gender === 'Male' ? 'm' : 'f';
    const age = parseInt(m.age);
    
    // Demographic Segments
    if (age <= 1) stats.demographics.age_0_12m[genderKey]++;
    else if (age <= 2) stats.demographics.age_13_24m[genderKey]++;
    else if (age >= 5 && age <= 6) stats.demographics.age_5_6y[genderKey]++;
    else if (age >= 10 && age <= 11) stats.demographics.age_10_11y[genderKey]++;
    // BUG-07 FIX: 16-17 band ends at 16, 17-19 starts at 17 — use strict ranges to avoid overlap
    else if (age >= 16 && age <= 16) stats.demographics.age_16_17y[genderKey]++;
    else if (age >= 17 && age <= 19) stats.demographics.age_17_19y[genderKey]++;
    else if (age >= 40 && age <= 60) stats.demographics.age_40_60y[genderKey]++;
    else if (age > 60) stats.demographics.age_60plus[genderKey]++;

    // Maternal Health — accept multiple ancStatus values
    if (health.ancStatus === 'active' || health.ancStatus === 'registered' || health.edd || health.isPregnant) {
      stats.maternal.mh01_newANC++;

      // BUG-06 FIX: Compute early ANC from LMP vs registration date (weeksAtReg is not stored)
      const lmpDate = health.lmp ? new Date(health.lmp) : null;
      const regDate = health.ancRegistrationDate ? new Date(health.ancRegistrationDate) : null;
      if (lmpDate && !isNaN(lmpDate) && regDate && !isNaN(regDate)) {
        const weeksAtReg = Math.floor((regDate - lmpDate) / (7 * 24 * 60 * 60 * 1000));
        if (weeksAtReg <= 12) stats.maternal.mh02_earlyANC++;
      } else if (health.weeksAtReg <= 12) {
        // Fallback to stored field if available
        stats.maternal.mh02_earlyANC++;
      }
      if (health.isHighRisk) {
        stats.maternal.mh05_hrpIdentified++;
        drillDown.mh05_hrpIdentified.push(m);
      }
      if (parseFloat(health.hbLevel) < 7) {
        stats.maternal.mh06_severeAnemia++;
        drillDown.mh06_severeAnemia.push(m);
      }
    }

    // Family Planning active usage (Current Users)
    if (m.gender === 'Female' && (health.fpMethod === 'permanent' || health.fpMethod === 'tubectomy')) {
      stats.fp.fp01_tubectomy++;
    } else if (m.gender === 'Male' && (health.fpMethod === 'permanent' || health.fpMethod === 'vasectomy')) {
      stats.fp.fp02_vasectomy++;
    } else if (health.fpMethod === 'iud' || health.fpMethod === 'iucd') {
      stats.fp.fp03_iucd++;
    } else if (health.fpMethod === 'ocp') {
      stats.fp.fp05_ocp++;
    } else if (health.fpMethod === 'condom' || health.fpMethod === 'condoms') {
      stats.fp.fp06_condoms++;
    }

    // Process completed tasks for this member this month
    const completed = health.completedTasks || [];
    const lastUpdated = health.lastUpdatedAt || m.lastUpdatedAt;
    if (lastUpdated && isMonthYear(lastUpdated, actualMonth, actualYear)) {
      completed.forEach(taskId => {
        if (taskId === `anc-visit-2-${m.id}` || taskId === `anc-visit-3-${m.id}`) {
          stats.maternal.mh03_tdDoses++;
        }
        if (taskId === `anc-visit-4-${m.id}`) {
          stats.maternal.mh04_anc4++;
        }
        if (taskId === `vax-atbirth-${m.id}`) {
          stats.child.ch04_bcg++;
        }
        if (taskId === `vax-14weeks-${m.id}`) {
          stats.child.ch05_penta3++;
        }
        if (taskId === `vax-9months-${m.id}`) {
          stats.child.ch06_mr1++;
        }
      });
    }

    // Child Health
    const childAge = parseInt(m.age);
    if (childAge <= 1 || (m.dob && ((new Date() - new Date(m.dob)) / (1000*60*60*24*365)) <= 1)) {
      if (health.birthWeight) stats.child.ch01_weighed++;
      if (parseFloat(health.birthWeight) < 2.5) stats.child.ch02_lbw++;
      if (health.vaccinationStatus === 'Complete') {
        if (m.gender === 'Male') stats.child.ch07_fullyImm_M++;
        else stats.child.ch08_fullyImm_F++;
      }
    }
    
    if (health.malnutritionStatus === 'SAM') {
      stats.child.ch11_samReferral++;
      drillDown.ch11_samReferral.push(m);
    }
  });

  // 2. Process Persistent Vital Events
  actualVitalEvents.forEach(e => {
    if (!isMonthYear(e.date || e.timestamp, actualMonth, actualYear)) return;

    if (e.type === 'Birth') {
      if (e.place === 'Hospital' || e.place === 'Public') stats.delivery.dl01_instPublic++;
      else if (e.place === 'Private') stats.delivery.dl02_instPrivate++;
      else if (e.isSBA) stats.delivery.dl03_homeSkilled++;
      else if (e.place === 'Home') stats.delivery.dl04_homeUnskilled++;

      if (e.gender === 'Male') stats.delivery.dl05_liveBirthM++;
      else stats.delivery.dl06_liveBirthF++;

      const bw = parseFloat(e.birthWeight);
      if (!isNaN(bw) && bw > 0) {
        stats.child.ch01_weighed++;
        if (bw < 2.5) stats.child.ch02_lbw++;
      }

      if (e.breastfeeding !== 'No' && e.breastfeeding !== 'no') {
        stats.child.ch03_bfInitiated++;
      }

      if (e.place === 'Hospital' || e.place === 'Private' || e.place === 'Public') {
        stats.delivery.dl09_pnc48hr++;
      }
    }

    if (e.type === 'Death') {
      const deathAge = parseInt(e.ageAtDeath);
      if (e.deathType === 'Maternal' || e.causeOfDeath === 'maternalDeath') {
        stats.vital.vs04_maternalDeath++;
        drillDown.vs04_maternalDeath.push(e);
      } else if (!isNaN(deathAge)) {
        if (deathAge <= 0) stats.vital.vs01_neonatalDeath++;
        else if (deathAge <= 1) stats.vital.vs02_infantDeath++;
        else if (deathAge <= 5) stats.vital.vs03_childDeath++;
        else stats.vital.vs05_adultDeath++;
      } else {
        if (e.causeOfDeath === 'infantDeath') stats.vital.vs02_infantDeath++;
        else stats.vital.vs05_adultDeath++;
      }
    }
  });

  // 3. Process Persistent VHND Sessions
  actualVhndSessions.forEach(s => {
    if (!isMonthYear(s.sessionDate || s.timestamp, actualMonth, actualYear)) return;

    stats.fp.fp06_condoms += parseInt(s.condomsDistributed || 0);
    stats.fp.fp05_ocp += parseInt(s.ocpDistributed || 0);
    stats.maternal.mh07_ifa180 += parseInt(s.ifaDistributed || 0);
  });

  // 4. Process Pending Events in Sync Queue
  actualPendingEvents.forEach(e => {
    const payload = e.payload || e;
    const eventTime = e.timestamp || payload.date || payload.sessionDate;
    if (!isMonthYear(eventTime, actualMonth, actualYear)) return;

    if (e.tableName === 'vital_events' || e.tableName === '@rural_health_vital_events') {
      if (actualVitalEvents.some(ve => ve.id === payload.id)) return;

      if (payload.type === 'Birth') {
        if (payload.place === 'Hospital' || payload.place === 'Public') stats.delivery.dl01_instPublic++;
        else if (payload.place === 'Private') stats.delivery.dl02_instPrivate++;
        else if (payload.isSBA) stats.delivery.dl03_homeSkilled++;
        else if (payload.place === 'Home') stats.delivery.dl04_homeUnskilled++;

        if (payload.gender === 'Male') stats.delivery.dl05_liveBirthM++;
        else stats.delivery.dl06_liveBirthF++;

        const bw = parseFloat(payload.birthWeight);
        if (!isNaN(bw) && bw > 0) {
          stats.child.ch01_weighed++;
          if (bw < 2.5) stats.child.ch02_lbw++;
        }

        if (payload.breastfeeding !== 'No' && payload.breastfeeding !== 'no') {
          stats.child.ch03_bfInitiated++;
        }

        if (payload.place === 'Hospital' || payload.place === 'Private' || payload.place === 'Public') {
          stats.delivery.dl09_pnc48hr++;
        }
      }

      if (payload.type === 'Death') {
        const deathAge = parseInt(payload.ageAtDeath);
        if (payload.deathType === 'Maternal' || payload.causeOfDeath === 'maternalDeath') {
          stats.vital.vs04_maternalDeath++;
          drillDown.vs04_maternalDeath.push(payload);
        } else if (!isNaN(deathAge)) {
          if (deathAge <= 0) stats.vital.vs01_neonatalDeath++;
          else if (deathAge <= 1) stats.vital.vs02_infantDeath++;
          else if (deathAge <= 5) stats.vital.vs03_childDeath++;
          else stats.vital.vs05_adultDeath++;
        } else {
          if (payload.causeOfDeath === 'infantDeath') stats.vital.vs02_infantDeath++;
          else stats.vital.vs05_adultDeath++;
        }
      }
    }

    if (e.tableName === 'vhnd_sessions' || e.tableName === '@rural_health_vhnd') {
      if (actualVhndSessions.some(vs => vs.id === payload.id)) return;

      stats.fp.fp06_condoms += parseInt(payload.condomsDistributed || 0);
      stats.fp.fp05_ocp += parseInt(payload.ocpDistributed || 0);
      stats.maternal.mh07_ifa180 += parseInt(payload.ifaDistributed || 0);
    }

    if (e.tableName === 'task_completions' || e.tableName === 'asha_task_completions') {
      const taskId = payload.taskId || '';
      if (taskId.startsWith('anc-visit-2-') || taskId.startsWith('anc-visit-3-')) {
        stats.maternal.mh03_tdDoses++;
      }
      if (taskId.startsWith('anc-visit-4-')) {
        stats.maternal.mh04_anc4++;
      }
      if (taskId.startsWith('vax-atbirth-')) {
        stats.child.ch04_bcg++;
      }
      if (taskId.startsWith('vax-14weeks-')) {
        stats.child.ch05_penta3++;
      }
      if (taskId.startsWith('vax-9months-')) {
        stats.child.ch06_mr1++;
      }
    }
  });

  return { stats, drillDown };
};
