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
 * 1.5 Post Natal Care (PNC)
 * @param {Date|string} deliveryDate - Date of Delivery
 * @param {boolean} isHomeBirth - If delivery was at home
 */
export const calculatePncSchedule = (deliveryDate, isHomeBirth = false) => {
  if (!deliveryDate) return [];
  const del = new Date(deliveryDate);
  if (isNaN(del.getTime())) return [];

  const pncDays = isHomeBirth ? [1, 3, 7, 14, 21, 28, 42] : [3, 7, 14, 21, 28, 42];
  
  return pncDays.map(day => {
    const d = new Date(del);
    d.setDate(del.getDate() + day);
    return { label: `PNC Day ${day}`, date: d, actions: 'Check bleeding, BP, breastfeeding' };
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

  members.filter(m => !m.isDeleted && m.status !== 'Deceased' && !m.isMigrant).forEach(member => {
    const health = member.healthData || {};
    const age = calculateAge(member.dob);

    // 1. Maternal Tasks (Only for eligible females)
    if (health.edd && shouldShowMaternalFields(member.gender, age)) {
      const lmp = new Date(health.edd);
      lmp.setDate(lmp.getDate() - 280);
      const ancSchedule = calculateMaternalSchedule(lmp);
      
      ancSchedule.forEach((visit, idx) => {
        const dueDate = new Date(visit.date);
          const taskId = `anc-${health.ancStatus === 'active' ? 'reg' : 'v'}-${idx}`; // Still using idx but safer prefixes
          // RUTHLESS FIX: Better to use semantic keys
          const semanticId = `anc-visit-${visit.week}-${member.id}`;
          
          generatedTasks.push({
            id: semanticId,
            member: member,
            memberId: member.id,
            memberName: `${member.firstName} ${member.lastName}`,
            serviceType: visit.label,
            houseNo: member.houseNo || 'N/A',
            isHighRisk: health.isHighRisk,
            status: (health.completedTasks || []).includes(semanticId) ? 'completed' : 'pending',
            details: `${visit.label} is due. ${visit.actions}`,
            priority: (health.isHighRisk || dueDate <= today) ? 'High' : 'Normal',
            dueDate: visit.date
          });
      });
    }

    // 1.5 Post-Natal Tasks (PNC)
    if (health.pncStatus === 'Pending' && health.lastDeliveryDate) {
      const pncSchedule = calculatePncSchedule(health.lastDeliveryDate, health.placeOfDelivery === 'Home');
      pncSchedule.forEach((visit, idx) => {
        const dueDate = new Date(visit.date);
        if (dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
          generatedTasks.push({
            id: `pnc-${member.id}-${idx}`,
            member: member,
            memberId: member.id,
            memberName: `${member.firstName} ${member.lastName}`,
            serviceType: visit.label,
            houseNo: member.houseNo || 'N/A',
            status: (health.completedTasks || []).includes(`pnc-${member.id}-${idx}`) ? 'completed' : 'pending',
            details: `Post-natal checkup due. ${visit.actions}`,
            priority: 'High',
            dueDate: visit.date
          });
        }
      });
      
      // JSY Paperwork Task
      generatedTasks.push({
        id: `jsy-${member.id}`,
        member: member,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        serviceType: 'JSY Paperwork',
        houseNo: member.houseNo || 'N/A',
        status: (health.completedTasks || []).includes(`jsy-${member.id}`) ? 'completed' : 'pending',
        details: 'Assist mother in filling JSY forms for incentive payment.',
        priority: 'Normal',
        dueDate: today
      });
    }

    // 2. Child Health & Vaccination Tasks (Only for age < 17)
    if (member.dob && age < 17) {
      // HBNC/HBYC only for children < 2 years
      if (age < 2) {
        const childSchedule = calculateChildSchedule(new Date(member.dob), health.placeOfDelivery === 'Home');
        const hbncVisits = childSchedule.hbnc || [];
        hbncVisits.forEach((visit, idx) => {
          const dueDate = new Date(visit.date);
          if (dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
            generatedTasks.push({
              id: `hbnc-${member.id}-${idx}`,
              member: member,
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

        const hbycVisits = childSchedule.hbyc || [];
        hbycVisits.forEach((visit, idx) => {
          const dueDate = new Date(visit.date);
          // HBYC tasks window (show 15 days in advance)
          if (dueDate <= new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)) {
            generatedTasks.push({
              id: `hbyc-${member.id}-${idx}`,
              member: member,
              memberId: member.id,
              memberName: `${member.firstName} ${member.lastName}`,
              serviceType: visit.label,
              houseNo: member.houseNo || 'N/A',
              status: (health.completedTasks || []).includes(`hbyc-${member.id}-${idx}`) ? 'completed' : 'pending',
              details: `HBYC visit for child development & nutrition.`,
              priority: 'Normal',
              dueDate: visit.date
            });
          }
        });
      }

      // Diarrhea Task
      if (health.hasDiarrhea) {
        generatedTasks.push({
          id: `ors-${member.id}`,
          member: member,
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          serviceType: 'Diarrhea Care',
          houseNo: member.houseNo || 'N/A',
          status: (health.completedTasks || []).includes(`ors-${member.id}`) ? 'completed' : 'pending',
          details: 'Provide ORS & Zinc. Demonstrate preparation and counsel on feeding.',
          priority: 'High',
          dueDate: today
        });
      }

      // Vaccination schedule for all under 17
      const vaxSchedule = calculateVaccinationSchedule(new Date(member.dob));
      vaxSchedule.forEach((vax) => {
        const dueDate = new Date(vax.date);
        
        // Window: Overdue (last 2 years) OR Upcoming (next 15 days)
        const twoYearsAgo = new Date(today);
        twoYearsAgo.setFullYear(today.getFullYear() - 2);
        
        const fifteenDaysAhead = new Date(today);
        fifteenDaysAhead.setDate(today.getDate() + 15);

        if (dueDate <= fifteenDaysAhead && dueDate > twoYearsAgo) {
           // RUTHLESS FIX: Semantic ID prevents 'ID Drift' during clinical schedule updates
           const semanticId = `vax-${vax.label.toLowerCase().replace(/[^a-z0-9]/g, '')}-${member.id}`;
           
           generatedTasks.push({
            id: semanticId,
            member: member,
            memberId: member.id,
            memberName: `${member.firstName} ${member.lastName}`,
            serviceType: `Vaccination: ${vax.label}`,
            houseNo: member.houseNo || 'N/A',
            status: (health.completedTasks || []).includes(semanticId) ? 'completed' : 'pending',
            details: `Due for ${vax.label}. Vaccines: ${vax.vaccines}`,
            priority: dueDate <= today ? 'High' : 'Normal', // Overdue is High, Upcoming is Normal
            dueDate: vax.date
          });
        }
      });
    }
    // 3. NCD Screening Tasks (Age >= 30, every 6 months)
    if (age >= 30) {
      const lastNcdDate = health.lastNcdDate ? new Date(health.lastNcdDate) : null;
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(today.getMonth() - 6);

      if (!lastNcdDate || lastNcdDate <= sixMonthsAgo) {
        generatedTasks.push({
          id: `ncd-${member.id}`,
          member: member,
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          serviceType: 'NCD Screening',
          houseNo: member.houseNo || 'N/A',
          status: (health.completedTasks || []).includes(`ncd-${member.id}`) ? 'completed' : 'pending',
          details: 'Routine NCD Screening (BP/Sugar) due.',
          priority: 'Normal',
          dueDate: lastNcdDate ? new Date(lastNcdDate.getTime() + 180 * 24 * 60 * 60 * 1000) : today
        });
      }
    }
    
    // 4. Family Planning Refills
    if (health.fpMethod === 'ocp' || health.fpMethod === 'condoms') {
      const lastFpDate = health.lastFpGivenDate ? new Date(health.lastFpGivenDate) : null;
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(today.getMonth() - 1);
      
      if (!lastFpDate || lastFpDate <= oneMonthAgo) {
        generatedTasks.push({
          id: `fp-${member.id}`,
          member: member,
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          serviceType: 'FP Supply Refill',
          houseNo: member.houseNo || 'N/A',
          status: 'pending', // Refills are recurring, so if it's due, it's pending
          details: `Monthly ${health.fpMethod.toUpperCase()} supply refill due.`,
          priority: 'Normal',
          dueDate: lastFpDate ? new Date(lastFpDate.getTime() + 30 * 24 * 60 * 60 * 1000) : today
        });
      }
    }

    // 5. TB Follow-up (If screening was positive)
    if (health.tbScreening?.hasCoughTwoWeeks || (health.tbScreening?.hasFever && health.tbScreening?.hasWeightLoss)) {
      generatedTasks.push({
        id: `tb-${member.id}`,
        member: member,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        serviceType: 'TB Sample Collection',
        houseNo: member.houseNo || 'N/A',
        status: (health.completedTasks || []).includes(`tb-${member.id}`) ? 'completed' : 'pending',
        details: 'Positive TB screening. Collect sputum sample and refer to PHC.',
        priority: 'High',
        dueDate: today
      });
    }

    // 6. Malaria Follow-up
    if (health.hasFeverWithChills) {
      generatedTasks.push({
        id: `mal-${member.id}`,
        member: member,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        serviceType: 'Malaria Slide Collection',
        houseNo: member.houseNo || 'N/A',
        status: (health.completedTasks || []).includes(`mal-${member.id}`) ? 'completed' : 'pending',
        details: 'Suspected Malaria (Fever with Chills). Collect blood slide and perform RDT.',
        priority: 'High',
        dueDate: today
      });
    }

    // 7. Malnutrition Follow-up (SAM/MAM)
    const muac = parseFloat(health.muac);
    if (age <= 5 && muac > 0 && muac < 12.5) {
      generatedTasks.push({
        id: `sam-${member.id}`,
        member: member,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        serviceType: muac < 11.5 ? 'SAM Care' : 'MAM Care',
        houseNo: member.houseNo || 'N/A',
        status: (health.completedTasks || []).includes(`sam-${member.id}`) ? 'completed' : 'pending',
        details: muac < 11.5 
          ? 'SAM Detected (MUAC < 11.5cm). Refer to Nutrition Rehabilitation Center (NRC).' 
          : 'MAM Detected (MUAC < 12.5cm). Provide extra nutrition and weekly monitoring.',
        priority: 'High',
        dueDate: today
      });
    }

    // 8. Leprosy Follow-up
    if (health.hasSkinPatches) {
      generatedTasks.push({
        id: `lep-${member.id}`,
        member: member,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        serviceType: 'Leprosy Referral',
        houseNo: member.houseNo || 'N/A',
        status: (health.completedTasks || []).includes(`lep-${member.id}`) ? 'completed' : 'pending',
        details: 'Suspected Leprosy (Skin Patches). Refer to PHC for sensation testing.',
        priority: 'Normal',
        dueDate: today
      });
    }

    // 9. TB DOTS Treatment (Weekly)
    if (health.onTbTreatment) {
      generatedTasks.push({
        id: `dots-${member.id}`,
        member: member,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        serviceType: 'TB DOTS Visit',
        houseNo: member.houseNo || 'N/A',
        status: 'pending', // DOTS is recurring
        details: 'Weekly DOTS follow-up. Ensure patient is taking medication regularly.',
        priority: 'High',
        dueDate: today
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
