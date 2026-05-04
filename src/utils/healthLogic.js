/**
 * Rural Health Comprehensive Medical Logic
 */

/**
 * 1. Maternal Care (ANC & PNC)
 * @param {Date|string} lmpDate - Last Menstrual Period Date
 */
export const calculateMaternalSchedule = (lmpDate) => {
  const lmp = new Date(lmpDate);
  if (isNaN(lmp.getTime())) return [];

  const edd = new Date(lmp);
  edd.setDate(lmp.getDate() + 280);

  // Return flat array of visits with computed dates (what DailyTaskListScreen expects)
  const visits = [
    { id: 1, label: 'ANC 1 (Registration)', timing: '<12 weeks', actions: 'Registration, Ht/Wt, BP, Hb', offsetWeeks: 8 },
    { id: 2, label: 'ANC 2', timing: '14-26 weeks', actions: 'BP, Sugar, TT-1', offsetWeeks: 20 },
    { id: 3, label: 'ANC 3', timing: '28-34 weeks', actions: 'BP, Hb, TT-2, Growth', offsetWeeks: 30 },
    { id: 4, label: 'ANC 4', timing: '36w-Term', actions: 'Birth Preparedness, Referral', offsetWeeks: 36 },
  ];

  return visits.map(v => {
    const d = new Date(lmp);
    d.setDate(lmp.getDate() + (v.offsetWeeks * 7));
    return { ...v, date: d, edd };
  });
};

/**
 * 2. Newborn & Child Care (HBNC & HBYC)
 * @param {Date|string} dob 
 * @param {boolean} isHomeBirth 
 */
export const calculateChildSchedule = (dob, isHomeBirth = false) => {
  if (!dob) return { hbnc: [], hbyc: [] };
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return { hbnc: [], hbyc: [] };
  
  const hbncDays = isHomeBirth ? [1, 3, 7, 14, 21, 28, 42] : [3, 7, 14, 21, 28, 42];
  const hbycMonths = [3, 6, 9, 12, 15];

  const hbnc = hbncDays.map(day => {
    const d = new Date(birth);
    d.setDate(birth.getDate() + day);
    return { label: `HBNC Day ${day}`, date: d };
  });

  const hbyc = hbycMonths.map(month => {
    const d = new Date(birth);
    d.setMonth(birth.getMonth() + month); // Using setMonth for better accuracy
    return { label: `HBYC Month ${month}`, date: d };
  });

  return { hbnc, hbyc };
};

/**
 * 3. Routine Immunization
 * @param {Date|string} dob 
 */
export const calculateVaccinationSchedule = (dob) => {
  if (!dob) return [];
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return [];
  
  const schedule = [
    { label: 'At Birth', vaccines: 'BCG, OPV-0, Hep B-0', offsetDays: 0 },
    { label: '6 Weeks', vaccines: 'OPV-1, Penta-1, Rota-1, fIPV-1, PCV-1', offsetDays: 42 },
    { label: '10 Weeks', vaccines: 'OPV-2, Penta-2, Rota-2', offsetDays: 70 },
    { label: '14 Weeks', vaccines: 'OPV-3, Penta-3, Rota-3, fIPV-2, PCV-2', offsetDays: 98 },
    { label: '9 Months', vaccines: 'MR-1, JE-1, Vit A-1, PCV-Booster', offsetMonths: 9 },
    { label: '16-24 Months', vaccines: 'MR-2, JE-2, DPT-B1, OPV-B, Vit A-2', offsetMonths: 16 },
    { label: '5-6 Years', vaccines: 'DPT Booster-2', offsetMonths: 60 },
    { label: '10 Years', vaccines: 'Td (Tetanus & adult Diphtheria)', offsetMonths: 120 },
    { label: '16 Years', vaccines: 'Td Booster', offsetMonths: 192 },
  ];

  return schedule.map(s => {
    const d = new Date(birth);
    if (s.offsetDays) d.setDate(birth.getDate() + s.offsetDays);
    if (s.offsetMonths) d.setMonth(birth.getMonth() + s.offsetMonths);
    return { ...s, date: d };
  });
};

/**
 * 4. Disease Screening (NCD & TB)
 */
export const getScreeningAlerts = (member, symptoms = {}) => {
  const alerts = [];
  if (member.age >= 30) {
    alerts.push({ type: 'NCD', label: 'NCD Screening Due', interval: 'Every 6 months' });
  }
  if (symptoms.coughWeeks > 2) {
    alerts.push({ type: 'TB', label: 'Sputum Test Required', reason: 'Cough > 2 weeks' });
  }
  if (symptoms.feverWithChills) {
    alerts.push({ type: 'Malaria', label: 'Blood Slide Required', reason: 'Fever with Chills' });
  }
  return alerts;
};

export const shouldShowMaternalFields = (gender, age) => gender === 'Female' && age >= 15 && age <= 49;

export const generateAllTasks = (members) => {
  const generatedTasks = [];
  const today = new Date();

  members.filter(m => m.status !== 'Deceased' && !m.isMigrant).forEach(member => {
    const health = member.healthData || {};
    const age = calculateAge(member.dob);

    // 1. Maternal Tasks (Only for eligible females)
    if (health.edd && shouldShowMaternalFields(member.gender, age)) {
      const lmp = new Date(health.edd);
      lmp.setDate(lmp.getDate() - 280);
      const ancSchedule = calculateMaternalSchedule(lmp);
      
      ancSchedule.forEach((visit, idx) => {
        const dueDate = new Date(visit.date);
        if (dueDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
          generatedTasks.push({
            id: `anc-${member.id}-${idx}`,
            memberId: member.id,
            memberName: `${member.firstName} ${member.lastName}`,
            serviceType: visit.label,
            houseNo: member.houseNo || 'N/A',
            isHighRisk: health.isHighRisk,
            status: (health.completedTasks || []).includes(`anc-${member.id}-${idx}`) ? 'completed' : 'pending',
            details: `${visit.label} is due. ${visit.actions}`,
            priority: health.isHighRisk ? 'High' : 'Normal',
            dueDate: visit.date
          });
        }
      });
    }

    // 2. Child Health & Vaccination Tasks (Only for age < 17)
    if (member.dob && age < 17) {
      // HBNC/HBYC only for children < 2 years
      if (age < 2) {
        const childSchedule = calculateChildSchedule(new Date(member.dob));
        const hbncVisits = childSchedule.hbnc || [];
        hbncVisits.forEach((visit, idx) => {
          const dueDate = new Date(visit.date);
          if (dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
            generatedTasks.push({
              id: `hbnc-${member.id}-${idx}`,
              memberId: member.id,
              memberName: `${member.firstName} ${member.lastName}`,
              serviceType: visit.label,
              houseNo: member.houseNo || 'N/A',
              status: (health.completedTasks || []).includes(`hbnc-${member.id}-${idx}`) ? 'completed' : 'pending',
              details: `Post-natal visit for newborn.`,
              priority: 'Normal',
              dueDate: visit.date
            });
          }
        });
      }

      // Vaccination schedule for all under 17
      const vaxSchedule = calculateVaccinationSchedule(new Date(member.dob));
      vaxSchedule.forEach((vax, idx) => {
        const dueDate = new Date(vax.date);
        // Only show overdue tasks if they are within a reasonable past window (e.g., 2 years) 
        // to avoid flooding with tasks from birth for a 16 year old
        const twoYearsAgo = new Date(today);
        twoYearsAgo.setFullYear(today.getFullYear() - 2);

        if (dueDate <= today && dueDate > twoYearsAgo) {
           generatedTasks.push({
            id: `vax-${member.id}-${idx}`,
            memberId: member.id,
            memberName: `${member.firstName} ${member.lastName}`,
            serviceType: `Vaccination: ${vax.label}`,
            houseNo: member.houseNo || 'N/A',
            status: (health.completedTasks || []).includes(`vax-${member.id}-${idx}`) ? 'completed' : 'pending',
            details: `Due for ${vax.label}. Vaccines: ${vax.vaccines}`,
            priority: 'High',
            dueDate: vax.date
          });
        }
      });
    }
  });

  return generatedTasks;
};

export const validateAadhaar = (aadhaar) => /^\d{12}$/.test(aadhaar);

export const calculateAge = (dob) => {
  if (!dob) return NaN;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return NaN;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

export const getSuggestedNames = (relative, relation) => {
  if (!relative) return { middleName: '', lastName: '' };
  let suggestedMiddle = '';
  const rel = relation.toLowerCase();
  
  if (['son', 'daughter', 'grandson', 'granddaughter'].includes(rel)) {
    suggestedMiddle = relative.firstName || '';
  } else if (['wife', 'daughter-in-law'].includes(rel)) {
    suggestedMiddle = relative.firstName || '';
  }
  
  return { middleName: suggestedMiddle, lastName: relative.lastName || '' };
};

export const ANC_RISK_FACTORS = [
  'Severe Anemia (Hb < 7)',
  'Hypertension (BP > 140/90)',
  'Diabetes (Sugar > 140)',
  'Previous C-Section',
  'Multiple Pregnancies (Twins/Triplets)',
  'Malpresentation (Breech/Transverse)',
  'Adolescent Pregnancy (< 18 yrs)',
  'Elderly Pregnancy (> 35 yrs)',
  'History of PPH/Eclampsia',
  'Obstructed Labor History',
];

/**
 * 5. Advanced Logic Enhancements
 */
export const calculateGracePeriod = (dueDate, days = 3) => {
  const d = new Date(dueDate);
  d.setDate(d.getDate() + days);
  return d;
};

export const checkMalnutrition = (weight, height, ageMonths) => {
  // Simplified Z-score logic for prototype
  // In reality, this requires WHO growth charts interpolation
  if (!weight || !height) return 'normal';
  
  // Fake simple logic:
  const isSam = weight < 5 && ageMonths > 6; 
  if (isSam) return 'high_risk'; // SAM
  return 'normal';
};
