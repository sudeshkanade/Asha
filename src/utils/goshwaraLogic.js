/**
 * Goshwara Aggregation Logic
 * Compiles individual records into SC-level abstract counts.
 */
export const generateGoshwaraReport = (members, events, month, year) => {
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
    else if (age >= 16 && age <= 17) stats.demographics.age_16_17y[genderKey]++;
    else if (age >= 17 && age <= 19) stats.demographics.age_17_19y[genderKey]++;
    else if (age >= 40 && age <= 60) stats.demographics.age_40_60y[genderKey]++;
    else if (age > 60) stats.demographics.age_60plus[genderKey]++;

    // Maternal Health — FIX B3: accept multiple ancStatus values
    if (health.ancStatus === 'active' || health.ancStatus === 'registered' || health.edd || health.isPregnant) {
      stats.maternal.mh01_newANC++;
      if (health.weeksAtReg <= 12) stats.maternal.mh02_earlyANC++;
      if (health.isHighRisk) {
        stats.maternal.mh05_hrpIdentified++;
        drillDown.mh05_hrpIdentified.push(m);
      }
      if (parseFloat(health.hbLevel) < 7) {
        stats.maternal.mh06_severeAnemia++;
        drillDown.mh06_severeAnemia.push(m);
      }
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

  // 2. Process Vital Events — FIX C5: Filter by month/year
  events.forEach(e => {
    const payload = e.payload || e;
    const ts = e.timestamp ? new Date(e.timestamp) : null;
    // Only process events from the requested month/year
    if (ts && (ts.getMonth() + 1 !== month || ts.getFullYear() !== year)) return;

    // Delivery & Births
    if (e.tableName === 'vital_events' && payload.type === 'Birth') {
      if (payload.place === 'Hospital') stats.delivery.dl01_instPublic++;
      else if (payload.place === 'Private') stats.delivery.dl02_instPrivate++;
      else if (payload.isSBA) stats.delivery.dl03_homeSkilled++;
      else if (payload.place === 'Home') stats.delivery.dl04_homeUnskilled++;

      if (payload.gender === 'Male') stats.delivery.dl05_liveBirthM++;
      else stats.delivery.dl06_liveBirthF++;
    }

    // Deaths
    if (e.tableName === 'vital_events' && payload.type === 'Death') {
      const deathAge = parseInt(payload.ageAtDeath);
      if (payload.deathType === 'Maternal') {
        stats.vital.vs04_maternalDeath++;
        drillDown.vs04_maternalDeath.push(payload);
      }
      else if (!isNaN(deathAge) && deathAge <= 0) stats.vital.vs01_neonatalDeath++;
      else if (!isNaN(deathAge) && deathAge <= 1) stats.vital.vs02_infantDeath++;
      else if (!isNaN(deathAge) && deathAge <= 5) stats.vital.vs03_childDeath++;
      else stats.vital.vs05_adultDeath++;
    }

    // Stock / FP from VHND sessions
    if (e.tableName === 'vhnd_sessions') {
      stats.fp.fp06_condoms += parseInt(payload.condomsDistributed || 0);
      stats.fp.fp05_ocp += parseInt(payload.ocpDistributed || 0);
    }
  });

  return { stats, drillDown };
};
