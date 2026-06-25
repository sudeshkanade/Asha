/**
 * Rural Health Comprehensive Medical Logic
 */
import { getMalnutritionStatus } from './whoGrowthCharts';

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
 * Standardized logic to determine if a member is a Post-Natal Care (PNC) case.
 * A PNC case is active if:
 * 1. pncStatus is explicitly 'Pending', 'active', or 'Active'
 * 2. OR lastDeliveryDate is within the last 42 days (6 weeks)
 * 3. OR the mother has a registered child whose DOB is within the last 42 days.
 */
export const isPncCase = (member, allMembers = []) => {
  if (member.gender === 'Male' || member.gender === 'male') return false;

  const health = member?.healthData || {};
  const status = (health.pncStatus || '').toLowerCase();
  
  if (status === 'pending' || status === 'active') return true;
  
  if (health.lastDeliveryDate) {
    const deliveryDate = new Date(health.lastDeliveryDate);
    if (!isNaN(deliveryDate.getTime())) {
      const daysSinceDelivery = (new Date() - deliveryDate) / (1000 * 60 * 60 * 24);
      if (daysSinceDelivery >= 0 && daysSinceDelivery <= 42) return true;
    }
  }

  // 3. Fallback: Check if she has a child less than 42 days old
  if (allMembers && allMembers.length > 0) {
    const familyMembers = allMembers.filter(m => m.familyId === member.familyId && m.id !== member.id);
    
    const husband = familyMembers.find(m => {
      if (m.gender !== 'Male') return false;
      const rel = (m.relationToHead || m.relation || '').toLowerCase();
      return rel === 'self (head)' || rel === 'head' || rel === 'husband';
    });
    const fatherFirstName = (husband ? husband.firstName : member.middleName || '').trim().toLowerCase();

    for (const child of familyMembers) {
      if (!child.dob) continue;
      
      const relation = (child.relationToHead || child.relation || '').toLowerCase();
      const isSonDaughter = ['son', 'daughter', 'child'].includes(relation);
      const childMiddleName = (child.middleName || '').trim().toLowerCase();
      const hasFatherMiddleName = fatherFirstName && childMiddleName === fatherFirstName;
      
      if (isSonDaughter || hasFatherMiddleName) {
         const birthDate = new Date(child.dob);
         if (!isNaN(birthDate.getTime())) {
            const daysOld = (new Date() - birthDate) / (1000 * 60 * 60 * 24);
            if (daysOld >= 0 && daysOld <= 42) {
               return true;
            }
         }
      }
    }
  }
  
  return false;
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
    // BUG-5 FIX: offsetDays: 0 is falsy. Use !== undefined to correctly handle
    // the "At Birth" vaccines (BCG, OPV-0, Hep-B) whose offset is exactly 0 days.
    if (s.offsetDays !== undefined) d.setDate(birth.getDate() + s.offsetDays);
    if (s.offsetMonths !== undefined) d.setMonth(birth.getMonth() + s.offsetMonths);
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

    // SAFETY-3 FIX: If DOB is missing or malformed, calculateAge returns NaN.
    // Previously, all age-gated conditions evaluated to false and the member
    // generated zero tasks with no warning to the ASHA worker.
    // Now we derive age from the stored `age` field as a fallback before giving up.
    const effectiveAge = !isNaN(age) ? age : (parseInt(member.age) ?? NaN);
    if (isNaN(effectiveAge)) {
      // Still inject emergency tasks that don't depend on age
      // (severe anemia, severe hypertension) even without a valid DOB
    }

    // RUTHLESS FIX: Reactive Clinical Trigger Injections
    // If severe vitals are detected, inject an IMMEDIATE Emergency Task
    // BUG-10 FIX: Always parseFloat before numeric comparison — hbLevel is stored as a string from TextInput
    const hb = parseFloat(health.hbLevel);
    if (!isNaN(hb) && hb > 0 && hb < 7) {
      generatedTasks.push({
        id: `emergency-hb-${member.id}`,
        member: member,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        serviceType: 'EMERGENCY REFERRAL',
        status: 'pending',
        details: `CRITICAL: Severe Anemia (Hb: ${health.hbLevel}). Transfer to PHC immediately for iron infusion/blood transfusion.`,
        priority: 'High',
        dueDate: today,
        isEmergency: true
      });
    }

    // SAFETY-1 FIX: WHO/NHM guidelines classify BP ≥140/90 as hypertension requiring action.
    // The previous threshold of 160/100 missed moderate hypertension (risk of eclampsia).
    // Using 160/100 as the emergency referral trigger and 140/90 for high-risk flagging.
    const bpSys = parseFloat(health.bpSystolic);
    const bpDia = parseFloat(health.bpDiastolic);
    if (!isNaN(bpSys) && !isNaN(bpDia) && (bpSys >= 160 || bpDia >= 100)) {
      generatedTasks.push({
        id: `emergency-bp-${member.id}`,
        member: member,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        serviceType: 'EMERGENCY REFERRAL',
        status: 'pending',
        details: `CRITICAL: Severe Hypertension (BP: ${health.bpSystolic}/${health.bpDiastolic}). Risk of Eclampsia. Transfer immediately.`,
        priority: 'High',
        dueDate: today,
        isEmergency: true
      });
    } else if (!isNaN(bpSys) && !isNaN(bpDia) && (bpSys >= 140 || bpDia >= 90)) {
      // SAFETY-1: Flag moderate hypertension as high-risk even if not an emergency transfer
      generatedTasks.push({
        id: `highrisk-bp-${member.id}`,
        member: member,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        serviceType: 'High-Risk BP Monitoring',
        status: 'pending',
        details: `HIGH RISK: Hypertension detected (BP: ${health.bpSystolic}/${health.bpDiastolic}). Monitor closely and refer if worsens.`,
        priority: 'High',
        dueDate: today,
        isEmergency: false
      });
    }

    // 1. Maternal Tasks (Only for eligible females)
    if (health.edd && shouldShowMaternalFields(member.gender, effectiveAge)) {
      const lmp = new Date(health.edd);
      lmp.setDate(lmp.getDate() - 280);
      const ancSchedule = calculateMaternalSchedule(lmp);
      
      const completedTaskIds = health.completedTasks || [];
      const maxCompletedAncWeek = Math.max(
        0,
        ...completedTaskIds
          .filter(id => id.startsWith('anc-visit-'))
          .map(id => parseInt(id.split('-')[2]) || 0)
      );

      ancSchedule.forEach((visit) => {
        const dueDate = new Date(visit.date);
        const semanticId = `anc-visit-${visit.id}-${member.id}`;
        const isActuallyDone = completedTaskIds.includes(semanticId);
        const isSequenceSuperceded = visit.id < maxCompletedAncWeek;

        if (!isActuallyDone && !isSequenceSuperceded) {
          generatedTasks.push({
            id: semanticId,
            member: member,
            memberId: member.id,
            memberName: `${member.firstName} ${member.lastName}`,
            serviceType: visit.label,
            houseNo: member.houseNo || 'N/A',
            isHighRisk: health.isHighRisk,
            status: 'pending',
            details: `${visit.label} is due. ${visit.actions}`,
            priority: (health.isHighRisk || dueDate <= today) ? 'High' : 'Normal',
            dueDate: visit.date
          });
        }
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
    if (member.dob && effectiveAge < 17) {
      // HBNC/HBYC only for children < 2 years
      if (effectiveAge < 2) {
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
      // RUTHLESS FIX: Essential Vaccine Persistence (Prevent Dropout Oversight)
      const ESSENTIAL_VACCINES = ['Measles 1', 'MR 1', 'Measles 2', 'MR 2', 'DPT Booster'];
      
      vaxSchedule.forEach((vax) => {
        const dueDate = new Date(vax.date);
        const isEssential = ESSENTIAL_VACCINES.some(ev => vax.label.includes(ev));
        const semanticId = `vax-${vax.label.toLowerCase().replace(/[^a-z0-9]/g, '')}-${member.id}`;
        const isDone = (health.completedTasks || []).includes(semanticId);

        // Standard vaccines drop off after 2 years; Essentials persist until age 10
        const ageLimit = isEssential ? 10 : 2;
        const cutoffDate = new Date(today);
        cutoffDate.setFullYear(today.getFullYear() - ageLimit);

        if (!isDone && dueDate > cutoffDate && dueDate <= new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)) {
           generatedTasks.push({
            id: semanticId,
            member: member,
            memberId: member.id,
            memberName: `${member.firstName} ${member.lastName}`,
            serviceType: `Vaccination: ${vax.label}`,
            houseNo: member.houseNo || 'N/A',
            status: 'pending',
            details: `Due for ${vax.label}. Vaccines: ${vax.vaccines}`,
            priority: dueDate <= today ? 'High' : 'Normal',
            dueDate: vax.date
          });
        }
      });
    }
    // 3. NCD Screening Tasks (Age >= 30, every 6 months)
    if (!isNaN(effectiveAge) && effectiveAge >= 30) {
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
    const weight = parseFloat(health.weight);
    
    // Calculate age in months
    const dobDate = member.dob ? new Date(member.dob) : null;
    // LOGIC-9 FIX: Account for whether the birth day-of-month has passed this month.
    // Previously: (yearDiff * 12 + monthDiff) — could be +1 month too early for same-month birthdays.
    let ageMonths = NaN;
    if (dobDate && !isNaN(dobDate.getTime())) {
      let months = (today.getFullYear() - dobDate.getFullYear()) * 12 + (today.getMonth() - dobDate.getMonth());
      if (today.getDate() < dobDate.getDate()) months -= 1; // birthday hasn't occurred yet this month
      ageMonths = months;
    }

    let malStatus = 'Normal';
    if (!isNaN(weight) && !isNaN(ageMonths) && ageMonths >= 0 && ageMonths <= 60) {
      malStatus = getMalnutritionStatus(weight, ageMonths, member.gender);
    }
    
    const isSam = (!isNaN(muac) && muac > 0 && muac < 11.5) || malStatus === 'SAM';
    const isMam = (!isNaN(muac) && muac >= 11.5 && muac < 12.5) || malStatus === 'MAM';

    // SAFETY-2 FIX: WHO SAM/MAM classification applies to children 6-59 months (under 5 years).
    // Using age < 5 (strictly less than) instead of age <= 5 to match the WHO definition.
    if (!isNaN(effectiveAge) && effectiveAge < 5 && (isSam || isMam)) {
      generatedTasks.push({
        id: `sam-${member.id}`,
        member: member,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        serviceType: isSam ? 'SAM Care' : 'MAM Care',
        houseNo: member.houseNo || 'N/A',
        status: (health.completedTasks || []).includes(`sam-${member.id}`) ? 'completed' : 'pending',
        details: isSam 
          ? 'SAM Detected (Weight/MUAC low). Refer to Nutrition Rehabilitation Center (NRC).' 
          : 'MAM Detected (Weight/MUAC low). Provide extra nutrition and weekly monitoring.',
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
    // Under Maharashtra conventions, child's middle name is the father's first name.
    // If the family head (relative) is female, her middle name is the husband's first name.
    if (relative.gender === 'Female' || relative.gender === 'female') {
      suggestedMiddle = relative.middleName || '';
    } else {
      suggestedMiddle = relative.firstName || '';
    }
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

export const checkMalnutrition = (weight, height, ageMonths, gender) => {
  if (!weight) return 'normal';
  const status = getMalnutritionStatus(weight, ageMonths, gender);
  if (status === 'SAM') return 'high_risk';
  if (status === 'MAM') return 'moderate_risk';
  return 'normal';
};
