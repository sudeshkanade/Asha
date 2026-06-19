import * as XLSX from 'xlsx';
import { storage, STORAGE_KEYS } from '../database/storage';
// BUG-04 FIX: Static import prevents Vite from excluding this module at runtime
import { REPORTS_CONFIG, INDICATOR_TARGETS, FP_INDICATORS } from './goshwaraConfig.js';

/**
 * Rural Health Tracker — Comprehensive Export Engine
 * 
 * Supports the following report types (each downloadable individually as .xlsx):
 * 
 * MEMBER REPORTS:
 *   null / 'MASTER'    — Full Population Register
 *   'NEW_ANC'          — ANC Registrations (pregnant women)
 *   'HIGH_RISK_ANC'    — High-Risk Pregnancies
 *   'SEVERE_ANEMIA'    — Severe Anemia Cases (Hb < 7)
 *   'SAM_CHILDREN'     — SAM/Malnourished Children
 *   'NCD_SCREENING'    — NCD Screened (BP/Sugar)
 *   'ELIGIBLE_COUPLE'  — Eligible Couples (EC Register)
 *   'CHILDREN_0_5'     — Children aged 0-5
 *   'PNC_CASES'        — Post-Natal Care cases
 *   'PWD'              — Persons with Disability
 *   'BPL_FAMILIES'     — BPL Family Members
 * 
 * EVENT REPORTS:
 *   'VITAL_BIRTHS'     — Birth Register
 *   'VITAL_DEATHS'     — Death Register
 *   'VHND_SESSIONS'    — VHND Session Log
 *   'FP_REGISTER'      — Family Planning Register
 */

// ===================== HELPER: Security Sanitizer =====================
/**
 * RUTHLESS FIX: Prevent Excel Formula Injection (CSV Injection)
 * Escapes characters that can be used to execute commands in Excel/XLSX
 */
const sanitizeValue = (val) => {
  if (typeof val !== 'string') return val;
  if (val.startsWith('=') || val.startsWith('+') || val.startsWith('-') || val.startsWith('@')) {
    return `'${val}`; // Prefix with single quote to force text interpretation
  }
  return val;
};

// ===================== HELPER: Dynamic Target Calculator =====================
export const getDynamicTarget = (baseTarget, population = 25000) => {
  if (baseTarget == null || typeof baseTarget !== 'number') return baseTarget;
  // NHM norms are based on a 25,000 baseline population
  return Math.round((baseTarget * population) / 25000);
};

// ===================== HELPER: Hierarchy filter =====================
const applyHierarchyFilter = (members, user) => {
  if (!user) return members;
  if (user.role === 'ASHA') {
    // DATA-CLEAN-P1A: Use full assignedVillages set + ashaId (not single villageId)
    const rawAssigned = user.assignedVillages || [];
    const assignedIds = new Set(rawAssigned.map(v => {
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object') return v.id || v.villageId;
      return null;
    }).filter(Boolean));
    if (user.villageId) assignedIds.add(user.villageId);
    return members.filter(m => m.ashaId === user.id || assignedIds.has(m.villageId) || !m.villageId);
  }
  if (user.role === 'ANM') return members.filter(m => m.subCenterId === user.subCenterId);
  if (user.role === 'MO') return members.filter(m => m.phcId === user.phcId);
  return members; // Admin sees all
};

// ===================== COLUMN DEFINITIONS =====================

const baseColumns = (m, family, user, userById = new Map(), villagesMap = new Map(), subCentersMap = new Map()) => {
  let ashaName = user?.name || 'N/A';
  
  // If current user is Admin/ANM/MO, look up the ASHA name for this specific member
  if (user?.role !== 'ASHA' && m.ashaId) {
    const asha = userById.get(m.ashaId);
    if (asha) ashaName = asha.name;
  }

  // BUG FIX: Member's own location data must take priority over the logged-in user's location.
  // Resolve missing names from lookup maps
  const phcName = m.phcName || family?.phcName || user?.phcName || m.phcId || 'N/A';
  
  let subCenterName = m.subCenterName || family?.subCenterName;
  if (!subCenterName && m.subCenterId && subCentersMap.has(m.subCenterId)) {
    subCenterName = subCentersMap.get(m.subCenterId).name;
  }
  subCenterName = subCenterName || user?.subCenterName || m.subCenterId || 'N/A';

  let villageName = m.villageName || family?.villageName;
  if (!villageName && m.villageId && villagesMap.has(m.villageId)) {
    villageName = villagesMap.get(m.villageId).name;
  }
  villageName = villageName || 'N/A';

  return {
    'Sr.No.': '', // filled later
    'ASHA Name': sanitizeValue(ashaName),
    'PHC': sanitizeValue(phcName),
    'Sub-Center': sanitizeValue(subCenterName),
    'Village': sanitizeValue(villageName),
    'House No.': sanitizeValue(m.houseNo || family?.houseNo || 'N/A'),
    'Family ID': sanitizeValue(m.familyId || 'N/A'),
    'First Name': sanitizeValue(m.firstName || ''),
    'Middle Name': sanitizeValue(m.middleName || ''),
    'Last Name': sanitizeValue(m.lastName || ''),
    'Relation to Head': m.relation || m.relationToHead || 'N/A',
    'Gender': m.gender || 'N/A',
    'Age': m.age || 'N/A',
    'DOB': m.dob || 'N/A',
    'Marital Status': m.maritalStatus || 'N/A',
    'Education': m.education || 'N/A',
    'Aadhaar': m.aadhaar || 'N/A',
    'ABHA ID': m.abhaId || 'N/A',
    'Mobile': m.phone || m.mobile || 'N/A',
    'Caste/Category': family.religionCaste || m.caste || 'N/A',
    'BPL': family.isBPL ? 'Yes' : 'No',
    'PwD': m.isPwd ? 'Yes' : 'No',
    'Migrant': m.isMigrant ? 'Yes' : 'No',
    'Status': m.status || 'Active',
  };
};

const ancColumns = (health) => ({
  'ANC Status': health.ancStatus || 'N/A',
  'EDD': health.edd || 'N/A',
  'LMP': health.lmp || 'N/A',
  'High Risk': health.isHighRisk ? 'Yes' : 'No',
  'Risk Factors': (health.selectedRiskFactors || []).join('; ') || 'None',
  'BP (Systolic)': health.bpSystolic || 'N/A',
  'BP (Diastolic)': health.bpDiastolic || 'N/A',
  'Hb Level (gm%)': health.hbLevel || 'N/A',
  'Weight (kg)': health.weight || 'N/A',
  'Sugar Level': health.sugarLevel || 'N/A',
  'Blood Group': health.bloodGroup || 'N/A',
  'IFA Tablets Given': health.ifaQuantity || '0',
  'Calcium Tablets Given': health.calciumQuantity || '0',
  'USG Date': health.usgDate || 'N/A',
  'Is Pregnant': health.isPregnant ? 'Yes' : 'No',
});

const childColumns = (health) => ({
  'Birth Weight (kg)': health.birthWeight || 'N/A',
  'Delivery Type': health.deliveryType || 'N/A',
  'Place of Delivery': health.placeOfDelivery || 'N/A',
  'Hospital Name': health.hospitalName || 'N/A',
  'Height (cm)': health.height || 'N/A',
  'MUAC (cm)': health.muac || 'N/A',
  'Vaccination Status': health.vaccinationStatus || 'N/A',
  'Malnutrition Status': health.malnutritionStatus || 'Normal',
  'Breastfeeding': health.exclusiveBreastfeeding !== undefined ? (health.exclusiveBreastfeeding ? 'Yes' : 'No') : (health.breastfeeding || 'N/A'),
  'Vitamin A Dose': health.vitaminADose || 'N/A',
  'Deworming Done': health.dewormingDone ? 'Yes' : 'No',
});

const fpColumns = (health) => ({
  'FP Method': health.fpMethod || 'None',
  'FP Start Date': health.fpStartDate || 'N/A',
  'FP Follow-up Due': health.fpFollowUp || 'N/A',
});

const ncdColumns = (health) => ({
  'BP (Systolic)': health.bpSystolic || 'N/A',
  'BP (Diastolic)': health.bpDiastolic || 'N/A',
  'Hb Level': health.hbLevel || 'N/A',
  'Sugar Level': health.sugarLevel || 'N/A',
  'Weight (kg)': health.weight || 'N/A',
  'Has Known NCD': health.hasNcd ? 'Yes' : 'No',
  'NCD Type': health.ncdType || 'N/A',
});

const pncColumns = (health) => ({
  'PNC Status': health.pncStatus || 'N/A',
  'Last Delivery Date': health.lastDeliveryDate || 'N/A',
  'Last Delivery Place': health.lastDeliveryPlace || 'N/A',
  'Hospital Name': health.lastDeliveryHospital || 'N/A',
});

const isCurrentMonth = (dateStr) => {
  if (!dateStr) return false;
  const ts = typeof dateStr === 'number' ? dateStr : Date.parse(dateStr);
  if (isNaN(ts)) return false;
  const date = new Date(ts);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

const diseaseColumns = (health) => ({
  'TB Suspect': health.tbScreening?.hasCoughTwoWeeks || (health.tbScreening?.hasFever && health.tbScreening?.hasWeightLoss) ? 'Yes' : 'No',
  'Malaria Suspect (Fever/Chills)': health.hasFeverWithChills ? 'Yes' : 'No',
  'Leprosy Suspect (Skin Patches)': health.hasSkinPatches ? 'Yes' : 'No',
});

// ===================== MAIN EXPORT FUNCTION =====================

export const exportMasterPopulation = async (user, filterType = null, additionalFilters = {}) => {
  try {
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
    const allUsers = await storage.getAll(STORAGE_KEYS.USERS);
    const allVillages = await storage.getAll(STORAGE_KEYS.VILLAGES);
    const allSubCenters = await storage.getAll(STORAGE_KEYS.SUB_CENTERS);

    // 1. Hierarchy filter
    let members = applyHierarchyFilter(allMembers, user);

    // 2. Apply report-specific filter
    if (filterType || Object.keys(additionalFilters).length > 0) {
      members = members.filter(m => {
        // Apply additional dynamic filters first
        if (additionalFilters.gender && additionalFilters.gender !== 'All' && m.gender !== additionalFilters.gender) return false;
        if (additionalFilters.villageId && additionalFilters.villageId !== 'All' && m.villageId !== additionalFilters.villageId) return false;
        const age = parseInt(m.age);
        if (additionalFilters.minAge !== undefined && !isNaN(age) && age < additionalFilters.minAge) return false;
        if (additionalFilters.maxAge !== undefined && !isNaN(age) && age > additionalFilters.maxAge) return false;

        if (!filterType) return true; // If only dynamic filters were applied

        const health = m.healthData || {};
        switch (filterType) {
          case 'NEW_ANC':
            return !!health.edd || health.isPregnant || health.ancStatus === 'active';
          case 'HIGH_RISK_ANC':
            return !!health.isHighRisk && (!!health.edd || health.isPregnant || health.ancStatus === 'active' || health.ancStatus === 'registered');
          case 'SEVERE_ANEMIA':
            return parseFloat(health.hbLevel) > 0 && parseFloat(health.hbLevel) < 7;
          case 'SAM_CHILDREN':
            return health.malnutritionStatus === 'SAM';
          case 'NCD_SCREENING':
            return age >= 30 && (health.bpSystolic || health.sugarLevel || health.hasNcd);
          case 'ELIGIBLE_COUPLE':
            return m.gender === 'Female' && age >= 15 && age <= 49 &&
              (m.maritalStatus === 'Married' || m.relation === 'Wife' || m.relationToHead === 'Wife');
          case 'CHILDREN_0_5':
            return age >= 0 && age <= 5;
          case 'PNC_CASES':
            return health.pncStatus === 'Pending' || health.pncStatus === 'Active';
          case 'PWD':
            return m.isPwd === true;
          case 'BPL_FAMILIES':
            const fam = allFamilies.find(f => f.id === m.familyId);
            return fam?.isBPL === true;
          case 'PENDING_ANC':
            return health.edd && !isCurrentMonth(m.lastUpdatedAt || health.lastUpdatedAt);
          case 'FULLY_IMMUNIZED': {
            const dobStr = m.dob;
            if (!dobStr) return false;
            const dob = new Date(dobStr);
            if (isNaN(dob.getTime())) return false;
            const now = new Date();
            const ageInMonths = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
            if (ageInMonths < 12) return false;
            
            const mandatoryVaccines = ['BCG', 'Pentavalent 3', 'MR 1', 'OPV 3'];
            const memberVaccines = m.vaccines?.map(v => v.name) || [];
            return mandatoryVaccines.every(v => memberVaccines.includes(v));
          }
          // BUG-09 FIX: Include male vasectomy cases in permanent FP (not just female tubectomy)
          case 'FP_PERMANENT':
            return (
              (m.gender === 'Female' && age >= 15 && age <= 49 &&
                (m.maritalStatus === 'Married' || m.relation === 'Wife' || m.relationToHead === 'Wife') &&
                (health.fpMethod === 'permanent' || health.fpMethod === 'tubectomy'))
              ||
              (m.gender === 'Male' && health.fpMethod === 'vasectomy')
            );
          case 'FP_SPACING':
            return m.gender === 'Female' && age >= 15 && age <= 49 &&
              (m.maritalStatus === 'Married' || m.relation === 'Wife' || m.relationToHead === 'Wife') &&
              health.fpMethod && health.fpMethod !== 'none' && health.fpMethod !== 'permanent' && health.fpMethod !== 'tubectomy';
          case 'FP_NONE':
            return m.gender === 'Female' && age >= 15 && age <= 49 &&
              (m.maritalStatus === 'Married' || m.relation === 'Wife' || m.relationToHead === 'Wife') &&
              (!health.fpMethod || health.fpMethod === 'none');
          case 'TB_SUSPECTS': {
            const tb = health.tbScreening;
            return !!(tb?.hasCoughTwoWeeks || (tb?.hasFever && tb?.hasWeightLoss));
          }
          case 'MALARIA_SUSPECTS':
            return !!health.hasFeverWithChills;
          case 'LEPROSY_SUSPECTS':
            return !!health.hasSkinPatches;
          default:
            return true;
        }
      });
    }

    // OPT-6 FIX: Pre-build lookup Maps to replace O(n²) allFamilies.find() inside .map()
    // For 500 members × 500 families the old approach = 250,000 comparisons per export.
    // Map lookups are O(1), reducing total export time from O(n²) → O(n).
    const familyById = new Map(allFamilies.map(f => [f.id, f]));
    const userById = new Map(allUsers.map(u => [u.id, u]));
    const villagesMap = new Map(allVillages.map(v => [v.id || v.villageId, v]));
    const subCentersMap = new Map(allSubCenters.map(sc => [sc.id || sc.subCenterId, sc]));

    // 3. Build rows with appropriate columns per report type
    const flatData = members.map((m, index) => {
      const family = familyById.get(m.familyId) || {};
      const health = m.healthData || {};
      const base = baseColumns(m, family, user, userById, villagesMap, subCentersMap);
      base['Sr.No.'] = index + 1;

      switch (filterType) {
        case 'NEW_ANC':
        case 'PENDING_ANC':
        case 'HIGH_RISK_ANC':
        case 'SEVERE_ANEMIA':
          return { ...base, ...ancColumns(health) };
        case 'SAM_CHILDREN':
        case 'CHILDREN_0_5':
        case 'FULLY_IMMUNIZED':
          return { ...base, ...childColumns(health) };
        case 'ELIGIBLE_COUPLE':
        case 'FP_PERMANENT':
        case 'FP_SPACING':
        case 'FP_NONE':
          return { ...base, ...fpColumns(health), ...ancColumns(health) };
        case 'NCD_SCREENING':
          return { ...base, ...ncdColumns(health) };
        case 'PNC_CASES':
          return { ...base, ...pncColumns(health), ...childColumns(health) };
        case 'TB_SUSPECTS':
        case 'MALARIA_SUSPECTS':
        case 'LEPROSY_SUSPECTS':
          return { ...base, ...diseaseColumns(health) };
        default:
          // MASTER export — include everything
          return {
            ...base,
            ...ancColumns(health),
            ...fpColumns(health),
            'Vaccination Status': health.vaccinationStatus || 'N/A',
            'Malnutrition': health.malnutritionStatus || 'Normal',
            'Last Updated': new Date(m.lastUpdatedAt || Date.now()).toLocaleDateString(),
          };
      }
    });

    // 4. Build workbook
    const sheetName = getSheetName(filterType);
    const ws = XLSX.utils.json_to_sheet(flatData);

    // Auto-size columns
    const colWidths = Object.keys(flatData[0] || {}).map(key => ({
      wch: Math.max(key.length + 2, 15)
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Add Summary Sheet based on filterType
    let summaryData = [];
    if (filterType === 'HIGH_RISK_ANC' || filterType === 'NEW_ANC' || filterType === 'PENDING_ANC' || filterType === 'SEVERE_ANEMIA') {
      summaryData = [
        { 'Metric': 'Total Pregnant Women', 'Count': flatData.length },
        { 'Metric': 'High Risk Cases', 'Count': flatData.filter(r => r['High Risk'] === 'Yes').length },
        { 'Metric': 'Severe Anemia (Hb < 7)', 'Count': flatData.filter(r => parseFloat(r['Hb Level (gm%)']) > 0 && parseFloat(r['Hb Level (gm%)']) < 7).length },
        { 'Metric': 'Received IFA', 'Count': flatData.filter(r => parseInt(r['IFA Tablets Given']) > 0).length }
      ];
    } else if (filterType === 'CHILDREN_0_5' || filterType === 'SAM_CHILDREN' || filterType === 'FULLY_IMMUNIZED') {
      summaryData = [
        { 'Metric': 'Total Children', 'Count': flatData.length },
        { 'Metric': 'SAM/High Risk Children', 'Count': flatData.filter(r => String(r['Malnutrition Status']).toUpperCase() === 'SAM' || String(r['Malnutrition Status']).toLowerCase() === 'high_risk').length },
        { 'Metric': 'Fully Immunized (Self-Reported)', 'Count': flatData.filter(r => String(r['Vaccination Status']).toLowerCase() === 'complete').length },
        { 'Metric': 'Received Deworming', 'Count': flatData.filter(r => r['Deworming Done'] === 'Yes').length }
      ];
    } else if (filterType === 'NCD_SCREENING') {
       summaryData = [
         { 'Metric': 'Total Screened', 'Count': flatData.length },
         { 'Metric': 'Known NCD Cases', 'Count': flatData.filter(r => r['Has Known NCD'] === 'Yes').length }
       ];
    } else if (!filterType || filterType === 'MASTER') {
       summaryData = [
         { 'Metric': 'Total Population', 'Count': flatData.length },
         { 'Metric': 'Males', 'Count': flatData.filter(r => r['Gender'] === 'Male').length },
         { 'Metric': 'Females', 'Count': flatData.filter(r => r['Gender'] === 'Female').length },
         { 'Metric': 'Eligible Couples', 'Count': flatData.filter(r => r['Gender'] === 'Female' && parseInt(r['Age']) >= 15 && parseInt(r['Age']) <= 49 && (r['Marital Status'] === 'Married' || r['Relation to Head'] === 'Wife' || String(r['Relation to Head']).toLowerCase() === 'daughter-in-law')).length },
         { 'Metric': 'Children (0-5)', 'Count': flatData.filter(r => parseInt(r['Age']) <= 5).length }
       ];
    }

    if (summaryData.length > 0) {
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 40 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    }

    // 5. Generate filename and download
    const timestamp = new Date().toISOString().split('T')[0];
    const tag = filterType || 'MASTER';
    const location = user?.villageName || user?.village || user?.name || 'Report';
    const filename = `${tag}_${location}_${timestamp}.xlsx`;

    XLSX.writeFile(wb, filename);
    return true;
  } catch (error) {
    console.error('Export Error:', error);
    return false;
  }
};

// ===================== VITAL EVENTS EXPORT =====================

export const exportVitalEvents = async (user, eventType = 'Birth', placeFilter = null, infantOnly = false) => {
  try {
    // BUG-3 FIX: allMembers was referenced in the infantOnly filter block but never declared
    // in this function's scope. It only existed in exportMasterPopulation, causing a
    // ReferenceError crash whenever infantOnly=true was passed.
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    const persistentVitalEvents = await storage.getAll(STORAGE_KEYS.VITAL_EVENTS);

    const combined = persistentVitalEvents.filter(e => e.type === eventType);

    // Apply place filter for births/deliveries
    let filteredEvents = combined;
    if (placeFilter) {
      filteredEvents = filteredEvents.filter(e => (e.place || '').toLowerCase() === placeFilter.toLowerCase());
    }

    // Apply infant only filter for deaths
    if (infantOnly) {
      filteredEvents = filteredEvents.filter(e => {
        const deathAge = parseInt(e.ageAtDeath || e.age || 999);
        const member = allMembers.find(m => m.id === e.memberId) || {};
        const memberAge = parseInt(member.age || 999);
        return deathAge < 1 || memberAge < 1 || e.causeOfDeath === 'infantDeath';
      });
    }

    // Hierarchy filter combined list
    if (user?.role === 'ASHA') {
      const rawAssigned = user.assignedVillages || [];
      const assignedIds = new Set(rawAssigned.map(v => {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object') return v.id || v.villageId;
        return null;
      }).filter(Boolean));
      if (user.villageId) assignedIds.add(user.villageId);
      filteredEvents = filteredEvents.filter(e =>
        e.ashaId === user.id || assignedIds.has(e.villageId) || !e.villageId
      );
    } else if (user?.role === 'ANM') {
      filteredEvents = filteredEvents.filter(e => e.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      filteredEvents = filteredEvents.filter(e => e.phcId === user.phcId);
    }

    // BUG-H6 FIX: Pre-build memberById Map to avoid O(n²) find() inside .map()
    // Birth rows previously called allMembers.find() TWICE per event for village and houseNo.
    // For 200 births × 1000 members = 400,000 comparisons. Now it's O(1) per lookup.
    const memberById = new Map(allMembers.map(m => [m.id, m]));

    let rows;
    if (eventType === 'Birth') {
      rows = filteredEvents.map((e, i) => {
        const mother = memberById.get(e.motherId) || {};
        return ({
          'Sr.No.': i + 1,
          'Date of Birth': e.date || 'N/A',
          'Child Name': e.name || 'N/A',
          'Gender': e.gender || 'N/A',
          'Mother Name': e.motherName || 'N/A',
          'Mother ID': e.motherId || 'N/A',
          'Birth Weight (kg)': e.birthWeight || 'N/A',
          'Place of Delivery': e.place || 'N/A',
          'Hospital Name': e.hospitalName || 'N/A',
          'Delivery Type': e.deliveryType || 'N/A',
          'Village': mother.villageName || e.villageName || 'N/A',
          'House No.': mother.houseNo || e.houseNo || 'N/A',
        });
      });
    } else {
      rows = filteredEvents.map((e, i) => {
        const member = memberById.get(e.memberId) || {};
        return {
          'Sr.No.': i + 1,
          'Date of Death': e.date || 'N/A',
          'Name': e.name || `${member.firstName || ''} ${member.lastName || ''}`,
          'Gender': member.gender || 'N/A',
          'Age': member.age || 'N/A',
          'Cause of Death': e.cause || e.causeOfDeath || 'N/A',
          'Village': member.villageName || e.villageName || 'N/A',
          'House No.': member.houseNo || e.houseNo || 'N/A',
          'Status': 'Deceased',
        };
      });
    }

    if (rows.length === 0) {
      rows = [{ 'Info': `No ${eventType} records found.` }];
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${eventType}_Register`);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${eventType}_Register_${user?.villageName || user?.village || 'Report'}_${timestamp}.xlsx`;
    XLSX.writeFile(wb, filename);
    return true;
  } catch (error) {
    console.error('Vital Export Error:', error);
    return false;
  }
};

// ===================== VHND SESSION EXPORT =====================

export const exportVHNDSessions = async (user) => {
  try {
    const events = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
    const persistentSessions = await storage.getAll(STORAGE_KEYS.VHND_SESSIONS);

    // Combine persistent sessions and queue sessions (prevent duplicates by ID)
    const queueSessions = events
      .filter(e => e.tableName === 'vhnd_sessions' || e.tableName === '@rural_health_vhnd')
      .map(e => e.payload || e);

    const combined = [...persistentSessions];
    queueSessions.forEach(qs => {
      if (!combined.some(ps => ps.id === qs.id)) {
        combined.push(qs);
      }
    });

    // Hierarchy filter combined list
    let filteredSessions = combined;
    if (user?.role === 'ASHA') {
      filteredSessions = combined.filter(s => s.ashaId === user.id || s.villageId === user.villageId);
    } else if (user?.role === 'ANM') {
      filteredSessions = combined.filter(s => s.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      filteredSessions = combined.filter(s => s.phcId === user.phcId);
    }

    const sessions = filteredSessions.map((p, i) => {
      return {
        'Sr.No.': i + 1,
        'Session Date': p.sessionDate || 'N/A',
        'Venue': p.venue || 'N/A',
        'Pregnant Women Attended': p.pregnantAttended || 0,
        'Children Attended': p.childrenAttended || 0,
        'Adolescents Attended': p.adolescentsAttended || 0,
        'Total Beneficiaries': (p.pregnantAttended || 0) + (p.childrenAttended || 0) + (p.adolescentsAttended || 0),
        'IFA Distributed': p.ifaDistributed || 0,
        'ORS Distributed': p.orsDistributed || 0,
        'Condoms Distributed': p.condomsDistributed || 0,
        'OCP Distributed': p.ocpDistributed || 0,
        'ECP Distributed': p.ecpDistributed || 0,
        'Notes': p.notes || '',
      };
    });

    if (sessions.length === 0) {
      sessions.push({ 'Info': 'No VHND sessions recorded.' });
    }

    const ws = XLSX.utils.json_to_sheet(sessions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VHND_Sessions');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `VHND_Sessions_${user?.villageName || user?.village || 'Report'}_${timestamp}.xlsx`;
    XLSX.writeFile(wb, filename);
    return true;
  } catch (error) {
    console.error('VHND Export Error:', error);
    return false;
  }
};

// ===================== FP REGISTER EXPORT =====================

export const exportFPRegister = async (user) => {
  try {
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
    let members = applyHierarchyFilter(allMembers, user);

    // EC: Married females 15-49
    const ecMembers = members.filter(m =>
      m.gender === 'Female' &&
      parseInt(m.age) >= 15 &&
      parseInt(m.age) <= 49 &&
      (m.maritalStatus === 'Married' || m.relation === 'Wife' || m.relationToHead === 'Wife')
    );

    // BUG FIX: Build all Maps here so they're available throughout the function
    const familyById = new Map(allFamilies.map(f => [f.id, f]));
    const familyMembersMap = new Map(); // familyId -> Member[]
    const husbandMap = new Map();       // familyId -> husband Member
    allMembers.forEach(m => {
      if (!familyMembersMap.has(m.familyId)) familyMembersMap.set(m.familyId, []);
      familyMembersMap.get(m.familyId).push(m);
    });
    // Identify the husband for each family (head or explicit husband relation)
    allMembers.forEach(m => {
      if (m.gender !== 'Male') return;
      const rel = (m.relationToHead || m.relation || '').toLowerCase();
      if (rel === 'self (head)' || rel === 'head' || rel === 'husband') {
        if (!husbandMap.has(m.familyId)) husbandMap.set(m.familyId, m);
      }
    });

    const rows = ecMembers.map((m, i) => {
      const family = familyById.get(m.familyId) || {};
      const health = m.healthData || {};
      const familyMembers = familyMembersMap.get(m.familyId) || [];
      const husband = husbandMap.get(m.familyId);
      const fatherFirstName = (husband ? husband.firstName : m.middleName || '').trim().toLowerCase();

      const childCount = familyMembers.filter(member => {
        if (member.id === m.id) return false;
        if (husband && member.id === husband.id) return false;
        const relation = (member.relationToHead || member.relation || '').toLowerCase();
        const isSonDaughter = ['son', 'daughter', 'child'].includes(relation);
        const childMiddleName = (member.middleName || '').trim().toLowerCase();
        const hasFatherMiddleName = fatherFirstName && childMiddleName === fatherFirstName;
        return hasFatherMiddleName || isSonDaughter;
      }).length;

      return {
        'Sr.No.': i + 1,
        'Village': m.villageName || family.villageName || 'N/A',
        'House No.': m.houseNo || family.houseNo || 'N/A',
        'Wife Name': `${m.firstName || ''} ${m.lastName || ''}`,
        'Age': m.age || 'N/A',
        'Husband Name': m.middleName || 'N/A',
        'No. of Children': childCount,
        'Current FP Method': health.fpMethod || 'None',
        'FP Method Category': health.fpMethod === 'permanent' ? 'Permanent' :
          (health.fpMethod && health.fpMethod !== 'none' ? 'Spacing' : 'None'),
        'Is Pregnant': health.isPregnant ? 'Yes' : 'No',
        'ANC Status': health.ancStatus || 'N/A',
        'EDD': health.edd || 'N/A',
        'Hb Level': health.hbLevel || 'N/A',
        'Caste/Category': family.religionCaste || 'N/A',
        'BPL': family.isBPL ? 'Yes' : 'No',
      };
    });


    if (rows.length === 0) {
      rows.push({ 'Info': 'No eligible couples found.' });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'EC_FP_Register');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `FP_Register_${user?.villageName || user?.village || 'Report'}_${timestamp}.xlsx`;
    XLSX.writeFile(wb, filename);
    return true;
  } catch (error) {
    console.error('FP Export Error:', error);
    return false;
  }
};

// ===================== PARENT-CHILD MAPPING EXPORT =====================

export const exportParentChildMapping = async (user) => {
  try {
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
    let members = applyHierarchyFilter(allMembers, user);

    // Identify all mothers (married females)
    const mothers = members.filter(m =>
      m.gender === 'Female' &&
      (m.maritalStatus === 'Married' || m.relation === 'Wife' || m.relationToHead === 'Wife' || m.relation === 'Mother' || m.relationToHead === 'Mother')
    );

    const familyById = new Map(allFamilies.map(f => [f.id, f]));
    const familyMembersMap = new Map();
    const husbandMap = new Map();
    
    allMembers.forEach(m => {
      if (!familyMembersMap.has(m.familyId)) familyMembersMap.set(m.familyId, []);
      familyMembersMap.get(m.familyId).push(m);
    });

    allMembers.forEach(m => {
      if (m.gender !== 'Male') return;
      const rel = (m.relationToHead || m.relation || '').toLowerCase();
      if (rel === 'self (head)' || rel === 'head' || rel === 'husband') {
        if (!husbandMap.has(m.familyId)) husbandMap.set(m.familyId, m);
      }
    });

    const rows = mothers.map((m, i) => {
      const family = familyById.get(m.familyId) || {};
      const familyMembers = familyMembersMap.get(m.familyId) || [];
      const husband = husbandMap.get(m.familyId);
      const fatherFirstName = (husband ? husband.firstName : m.middleName || '').trim().toLowerCase();

      // Find children
      const children = familyMembers.filter(member => {
        if (member.id === m.id) return false;
        if (husband && member.id === husband.id) return false;
        const relation = (member.relationToHead || member.relation || '').toLowerCase();
        const isSonDaughter = ['son', 'daughter', 'child'].includes(relation);
        const childMiddleName = (member.middleName || '').trim().toLowerCase();
        const hasFatherMiddleName = fatherFirstName && childMiddleName === fatherFirstName;
        return hasFatherMiddleName || isSonDaughter;
      }).sort((a, b) => parseInt(b.age || 0) - parseInt(a.age || 0)); // Sort oldest first

      const row = {
        'Sr.No.': i + 1,
        'Village': sanitizeValue(m.villageName || family.villageName || 'N/A'),
        'House No.': sanitizeValue(m.houseNo || family.houseNo || 'N/A'),
        'Mother Name': sanitizeValue(`${m.firstName || ''} ${m.lastName || ''}`),
        'Mother Age': m.age || 'N/A',
        'Father/Husband Name': sanitizeValue(husband ? `${husband.firstName} ${husband.lastName}` : m.middleName || 'N/A'),
        'Total Children': children.length,
      };

      // Add columns for up to 6 children
      for (let j = 0; j < 6; j++) {
        const child = children[j];
        if (child) {
          row[`Child ${j + 1} Name`] = sanitizeValue(`${child.firstName || ''} ${child.lastName || ''}`);
          row[`Child ${j + 1} Age`] = child.age || 'N/A';
          row[`Child ${j + 1} Gender`] = child.gender || 'N/A';
        } else {
          row[`Child ${j + 1} Name`] = '';
          row[`Child ${j + 1} Age`] = '';
          row[`Child ${j + 1} Gender`] = '';
        }
      }

      return row;
    });

    // Summary calculation
    const summary = {
      '0 Children': rows.filter(r => r['Total Children'] === 0).length,
      '1 Child': rows.filter(r => r['Total Children'] === 1).length,
      '2 Children': rows.filter(r => r['Total Children'] === 2).length,
      '3+ Children': rows.filter(r => r['Total Children'] >= 3).length,
      'Total Mothers': rows.length,
      'Total Children Found': rows.reduce((acc, r) => acc + r['Total Children'], 0)
    };

    if (rows.length === 0) {
      rows.push({ 'Info': 'No mothers/parents found.' });
    }

    const wb = XLSX.utils.book_new();
    
    // Add Detail Sheet
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Parent_Child_Details');

    // Add Summary Sheet
    const wsSummary = XLSX.utils.json_to_sheet([summary]);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Parent_Child_Mapping_${user?.villageName || user?.village || 'Report'}_${timestamp}.xlsx`;
    XLSX.writeFile(wb, filename);
    return true;
  } catch (error) {
    console.error('Parent-Child Export Error:', error);
    return false;
  }
};

// ===================== MPR SUMMARY EXPORT =====================

export const exportMPRSummary = async (user, reportData) => {
  try {
    const rows = [
      { 'Section': '1. MATERNAL HEALTH', 'Indicator': 'New ANC Registrations', 'Count': reportData.maternal.newANC },
      { 'Section': '', 'Indicator': 'High-Risk Pregnancies', 'Count': reportData.maternal.highRiskTotal },
      { 'Section': '', 'Indicator': 'Severe Anemia (Hb < 7)', 'Count': reportData.maternal.severeAnemia },
      { 'Section': '', 'Indicator': 'Hospital Deliveries', 'Count': reportData.maternal.hospitalDeliveries },
      { 'Section': '', 'Indicator': 'Home Deliveries', 'Count': reportData.maternal.homeDeliveries },
      { 'Section': '', 'Indicator': 'Pending ANC Follow-up', 'Count': reportData.maternal.pendingANC },
      { 'Section': '2. VITAL EVENTS', 'Indicator': 'Total Births', 'Count': reportData.vital.births },
      { 'Section': '', 'Indicator': 'Total Deaths', 'Count': reportData.vital.deaths },
      { 'Section': '', 'Indicator': 'Infant Deaths', 'Count': reportData.vital.infantDeaths },
      { 'Section': '3. CHILD HEALTH', 'Indicator': 'SAM Children', 'Count': reportData.child.samChildren },
      { 'Section': '', 'Indicator': 'Fully Immunized', 'Count': reportData.child.fullyImmunized },
      { 'Section': '4. FAMILY PLANNING', 'Indicator': 'Total Eligible Couples', 'Count': reportData.fp.totalEC },
      { 'Section': '', 'Indicator': 'Permanent (Sterilization)', 'Count': reportData.fp.sterilization },
      { 'Section': '', 'Indicator': 'Spacing Methods', 'Count': reportData.fp.spacing },
      { 'Section': '', 'Indicator': 'No Method', 'Count': reportData.fp.none },
      { 'Section': '5. STOCK', 'Indicator': 'IFA Tablets Distributed', 'Count': reportData.stock.ironDistributed },
      { 'Section': '', 'Indicator': 'ORS Packets', 'Count': reportData.stock.orsDistributed },
      { 'Section': '', 'Indicator': 'Condoms', 'Count': reportData.stock.condomsDistributed },
      { 'Section': '6. NCD', 'Indicator': 'Total Screened (30+)', 'Count': reportData.ncd.screened },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MPR_Summary');

    const timestamp = new Date().toISOString().split('T')[0];
    const monthName = reportData.monthName || new Date().toLocaleString('default', { month: 'long' });
    const filename = `MPR_Summary_${monthName}_${user?.villageName || user?.village || 'Report'}_${timestamp}.xlsx`;
    XLSX.writeFile(wb, filename);
    return true;
  } catch (error) {
    console.error('MPR Summary Export Error:', error);
    return false;
  }
};

// ===================== IDSP FORM S EXPORT =====================

export const exportFormS = async (user) => {
  try {
    const logs = await storage.getAll(STORAGE_KEYS.IDSP_SURVEILLANCE);
    const rows = logs.map((l, i) => ({
      'Sr.No.': i + 1,
      'Week Ending': new Date(l.timestamp).toLocaleDateString(),
      'Village': sanitizeValue(l.villageName || l.villageId),  // DATA-CLEAN-P2C: show name not raw ID
      'Fever Cases': l.feverCount,
      'Diarrhea Cases': l.diarrheaCount,
      'Pneumonia': 0,
      'Jaundice': 0,
      'Dog Bites': 0,
      'Total Cases': l.feverCount + l.diarrheaCount
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FormS_IDSP');
    XLSX.writeFile(wb, `FormS_IDSP_${user?.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (e) {
    return false;
  }
};

// ===================== INDENT FORM EXPORT =====================

export const exportIndent = async (user) => {
  try {
    const stock = await storage.getAll(STORAGE_KEYS.STOCK);
    const rows = stock
      .filter(i => i.currentQuantity <= i.minThreshold)
      .map((i, idx) => ({
        'Sr.No.': idx + 1,
        'Item Name': sanitizeValue(i.name),
        'Batch No': sanitizeValue(i.batchNo || 'N/A'),
        'Unit': sanitizeValue(i.unit),
        'Closing Stock': i.currentQuantity,
        'Required Qty': i.maxCapacity - i.currentQuantity,
        'Justification': 'Refill buffer stock'
      }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SC_Indent');
    XLSX.writeFile(wb, `Indent_${sanitizeValue(user?.name)}_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (e) {
    return false;
  }
};

// ===================== PHC MONTHLY WORKBOOK EXPORT =====================
/**
 * Generates the full PHC Monthly Workbook (21 sheets) as defined in REPORTS_CONFIG.
 * Each sheet lists indicators (rows) with columns: Indicator | SubCenterId/Village | Actual | Target
 * Role-based: ANM → scoped to their subCenter, MO → full PHC, ASHA → single village.
 */
export const exportPHCMonthlyWorkbook = async (user, reportData, targetPopulation = 25000) => {
  try {
    // BUG-04 FIX: REPORTS_CONFIG and INDICATOR_TARGETS now come from the static top-level import
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    const allVitalEvents = await storage.getAll(STORAGE_KEYS.VITAL_EVENTS);
    const allVhndSessions = await storage.getAll(STORAGE_KEYS.VHND_SESSIONS);
    const allStock = await storage.getAll(STORAGE_KEYS.STOCK);

    // Scope label for the report header
    let scopeLabel = user?.name || 'Report';
    if (user?.role === 'ANM') scopeLabel = user?.subCenterName || user?.subCenterId || scopeLabel;
    else if (user?.role === 'MO') scopeLabel = user?.phcName || user?.phcId || scopeLabel;

    const monthName = new Date().toLocaleString('default', { month: 'long' });
    const year = new Date().getFullYear();

    // Build a simple aggregator lookup from live data
    const members = applyHierarchyFilter(allMembers, user);

    const aggregateLookup = buildMonthlyAggregator(members, allVitalEvents, allVhndSessions, allStock, user, reportData);

    const wb = XLSX.utils.book_new();

    REPORTS_CONFIG.forEach(({ sheetName, sectionTitle, params }) => {
      const rows = [
        { 'Section': sectionTitle, 'Indicator': 'MONTHLY REPORT - ' + monthName + ' ' + year, 'Scope': scopeLabel, 'Actual': '', 'Target': '' }
      ];
      params.forEach(param => {
        const actual = aggregateLookup[param] ?? '';
        const baseTarget = INDICATOR_TARGETS[param];
        const target = getDynamicTarget(baseTarget, targetPopulation) ?? '';
        rows.push({
          'Section': '',
          'Indicator': param,
          'Scope': scopeLabel,
          'Actual': actual,
          'Target': target,
        });
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 45 }, // Indicator
        { wch: 12 }, // Scope
        { wch: 12 }, // Actual
        { wch: 12 }, // Target
      ];
      // Remove 'Section' column from display (first column), rename header
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Excel max 31 chars
    });

    // Append Verification_Audit_Log sheet
    const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
    const auditRows = members.map((m, index) => {
      const family = allFamilies.find(f => f.id === m.familyId) || {};
      const health = m.healthData || {};
      return {
        'Sr.No.': index + 1,
        'Name': `${m.firstName || ''} ${m.lastName || ''}`,
        'Age': m.age || 'N/A',
        'Gender': m.gender || 'N/A',
        'Village': m.villageName || family?.villageName || 'N/A',
        'ANC Status': health.ancStatus || 'N/A',
        'Is Pregnant': health.isPregnant ? 'Yes' : 'No',
        'NCD Screened': (parseInt(m.age) >= 30 && (health.bpSystolic || health.sugarLevel || health.hasNcd)) ? 'Yes' : 'No',
        'FP Method': health.fpMethod || 'None',
        'Status': m.status || 'Active'
      };
    });
    
    if (auditRows.length > 0) {
      const auditWs = XLSX.utils.json_to_sheet(auditRows);
      auditWs['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, auditWs, 'Verification_Audit_Log'.substring(0, 31));
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Monthly_Report_${scopeLabel}_${monthName}_${year}_${timestamp}.xlsx`;
    XLSX.writeFile(wb, filename);
    return true;
  } catch (error) {
    console.error('PHC Monthly Workbook Export Error:', error);
    return false;
  }
};

/**
 * Builds a lookup table: indicatorLabel → computed count from live member/event data.
 * Covers the main computable indicators. Others remain blank (to be filled manually or from VHND/Stock).
 */
const buildMonthlyAggregator = (members, vitalEvents, vhndSessions, stock, user, reportData) => {
  const lookup = {};

  // Use reportData if provided (from GoshwaraReportScreen which already has computed stats)
  if (reportData && reportData.stats) {
    const s = reportData.stats;
    lookup['Total ANC Registered / एकूण नोंदणीकृत गरोदर माता'] = s.maternal?.mh01_newANC ?? 0;
    lookup['ANC Registered < 12W / १२ आठवड्यांच्या आत नोंदणी'] = s.maternal?.mh02_earlyANC ?? 0;
    lookup['High Risk Cases Detected / अतिधोकादायक माता शोधल्या'] = s.maternal?.mh05_hrpIdentified ?? 0;
    lookup['Severe Anemia Managed / तीव्र ॲनिमिया व्यवस्थापन'] = s.maternal?.mh06_severeAnemia ?? 0;
    lookup['Total Deliveries / एकूण प्रसूती'] = (s.delivery?.dl01_instPublic ?? 0) + (s.delivery?.dl02_instPrivate ?? 0) + (s.delivery?.dl03_homeSkilled ?? 0) + (s.delivery?.dl04_homeUnskilled ?? 0);
    lookup['Institutional Deliveries / संस्थात्मक प्रसूती'] = (s.delivery?.dl01_instPublic ?? 0) + (s.delivery?.dl02_instPrivate ?? 0);
    lookup['Home Deliveries / घरी प्रसूती'] = (s.delivery?.dl03_homeSkilled ?? 0) + (s.delivery?.dl04_homeUnskilled ?? 0);
    lookup['Live Births (Male) / जिवंत जन्म (मुलगा)'] = s.delivery?.dl05_liveBirthM ?? 0;
    lookup['Live Births (Female) / जिवंत जन्म (मुलगी)'] = s.delivery?.dl06_liveBirthF ?? 0;
    lookup['Still Births / मृत जन्म'] = s.delivery?.dl07_stillBirths ?? 0;
    lookup['PNC Checkups < 48 Hours / ४८ तासांच्या आत तपासणी'] = s.delivery?.dl09_pnc48hr ?? 0;
    lookup['Maternal Deaths / माता मृत्यू'] = s.vital?.vs04_maternalDeath ?? 0;
    lookup['Maternal Deaths (15-49 Yrs) / माता मृत्यू (१५-४९ वर्षे)'] = s.vital?.vs04_maternalDeath ?? 0;
    lookup['Low Birth Weight (<2.5kg) / कमी वजनाचे बाळ'] = s.child?.ch02_lbw ?? 0;
    lookup['BCG / बी.सी.जी.'] = s.child?.ch04_bcg ?? 0;
    lookup['Penta 3 / पेंटा-३'] = s.child?.ch05_penta3 ?? 0;
    lookup['Measles 1 / गोवर रुबेला-१'] = s.child?.ch06_mr1 ?? 0;
    lookup['Full Immunised Children / पूर्ण लसीकरण बालके'] = (s.child?.ch07_fullyImm_M ?? 0) + (s.child?.ch08_fullyImm_F ?? 0);
    lookup['Infant Deaths (<1yr) / अर्भक मृत्यू'] = s.vital?.vs02_infantDeath ?? 0;
    lookup['Tubectomy / स्त्री नसबंदी'] = s.fp?.fp01_tubectomy ?? 0;
    lookup['Vasectomy / पुरुष नसबंदी'] = s.fp?.fp02_vasectomy ?? 0;
    lookup['IUD (Copper T) / तांबी'] = s.fp?.fp03_iucd ?? 0;
    lookup['Oral Pills (OCP) / गर्भनिरोधक गोळ्या'] = s.fp?.fp05_ocp ?? 0;
    lookup['Condoms / निरोध'] = s.fp?.fp06_condoms ?? 0;
  }

  // Derive from members if not already set
  const ec = members.filter(m => m.gender === 'Female' && parseInt(m.age) >= 15 && parseInt(m.age) <= 49 && (m.maritalStatus === 'Married' || m.relation === 'Wife' || m.relationToHead === 'Wife'));

  if (!lookup['Tubectomy / स्त्री नसबंदी']) {
    lookup['Tubectomy / स्त्री नसबंदी'] = ec.filter(m => m.healthData?.fpMethod === 'tubectomy' || m.healthData?.fpMethod === 'permanent').length;
  }
  if (!lookup['IUD (Copper T) / तांबी']) {
    lookup['IUD (Copper T) / तांबी'] = ec.filter(m => ['iud', 'iucd', 'copper_t'].includes((m.healthData?.fpMethod || '').toLowerCase())).length;
  }

  // VHND-based indicators
  const totalSessions = vhndSessions.length;
  lookup['MCP Session (Outreach) / एम.सी.पी. सत्र (बाह्यरुग्ण)'] = totalSessions;

  const ironTotal = vhndSessions.reduce((acc, s) => acc + (s.ifaDistributed || 0), 0);
  const orsTotal = vhndSessions.reduce((acc, s) => acc + (s.orsDistributed || 0), 0);
  const condomTotal = vhndSessions.reduce((acc, s) => acc + (s.condomsDistributed || 0), 0);
  lookup['IFA Prophylactic Dose 1 / आय.एफ.ए. प्रतिबंधात्मक मात्रा १'] = ironTotal;
  lookup['ORS Packets Stock Out Days / ओ.आर.एस. साठा नसलेले दिवस'] = orsTotal > 0 ? 0 : totalSessions;
  lookup['Condoms / निरोध'] = lookup['Condoms / निरोध'] || condomTotal;

  return lookup;
};

// ===================== FAMILY SURVEY REPORT EXPORT =====================
/**
 * Generates the PHC Family Survey Goshwara (FP indicators per subcenter/village).
 * Role-based: ANM → their subcenter villages, MO → all subcenters, ASHA → their village only.
 * Creates one sheet per subcenter with all 152 FP indicators, plus summary Tables 1-6.
 */
export const exportFamilySurveyReport = async (user) => {
  try {
    // BUG-04 FIX: FP_INDICATORS now comes from the static top-level import
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);

    const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);

    const members = applyHierarchyFilter(allMembers, user);
    const families = allFamilies.filter(f => members.some(m => m.familyId === f.id));

    // Group members by subcenter then village
    const subCenterMap = {};
    members.forEach(m => {
      const sc = m.subCenterId || 'Unknown';
      if (!subCenterMap[sc]) subCenterMap[sc] = { name: m.subCenterName || sc, villages: {} };
      const v = m.villageId || 'Unknown';
      if (!subCenterMap[sc].villages[v]) subCenterMap[sc].villages[v] = { name: m.villageName || v, members: [] };
      subCenterMap[sc].villages[v].members.push(m);
    });

    const wb = XLSX.utils.book_new();
    const monthName = new Date().toLocaleString('default', { month: 'long' });
    const year = new Date().getFullYear();

    // Create one entry sheet per subcenter
    Object.entries(subCenterMap).forEach(([scId, scData]) => {
      const scName = scData.name.replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 20) || scId;
      const sheetName = `Entry_${scName}`;

      // Aggregate all villages under this subcenter
      const scMembers = Object.values(scData.villages).flatMap(v => v.members);
      const scFamilies = allFamilies.filter(f => scMembers.some(m => m.familyId === f.id));

      const aggRow = aggregateFPIndicators(FP_INDICATORS, scMembers, scFamilies, allMembers);

      const rows = FP_INDICATORS.map((indicator, idx) => ({
        'Sr.': idx + 1,
        'Indicator / निर्देशक': indicator,
        'Count / संख्या': aggRow[indicator] ?? 0,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 5 }, { wch: 70 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
    });

    // Table 1: Population Summary
    const allEc = members.filter(m => m.gender === 'Female' && parseInt(m.age) >= 15 && parseInt(m.age) <= 49 && (m.maritalStatus === 'Married' || m.relation === 'Wife' || m.relationToHead === 'Wife'));
    const table1Rows = [
      { 'Indicator': 'Total Families / एकूण कुटुंबे', 'Count': families.length },
      { 'Indicator': 'Total Population / एकूण लोकसंख्या', 'Count': members.length },
      { 'Indicator': 'Males / पुरुष', 'Count': members.filter(m => m.gender === 'Male').length },
      { 'Indicator': 'Females / स्त्रिया', 'Count': members.filter(m => m.gender === 'Female').length },
      { 'Indicator': 'Eligible Couples (EC) / पात्र जोडपे', 'Count': allEc.length },
      { 'Indicator': 'BPL Families / दारिद्र्य रेषेखालील कुटुंबे', 'Count': families.filter(f => f.isBPL).length },
      { 'Indicator': 'SC Families / अनुसूचित जाती कुटुंबे', 'Count': families.filter(f => (f.religionCaste || '').toLowerCase().includes('sc')).length },
      { 'Indicator': 'ST Families / अनुसूचित जमाती कुटुंबे', 'Count': families.filter(f => (f.religionCaste || '').toLowerCase().includes('st')).length },
    ];
    addSheet(wb, 'तक्ता_१', table1Rows);

    // Table 2: FP Protected Couples
    const fpProtected = allEc.filter(m => m.healthData?.fpMethod && m.healthData.fpMethod !== 'none');
    const fpPermanent = allEc.filter(m => ['tubectomy', 'permanent', 'vasectomy'].includes((m.healthData?.fpMethod || '').toLowerCase()));
    const fpSpacing = fpProtected.filter(m => !fpPermanent.includes(m));
    const table2Rows = [
      { 'Indicator': 'Protected Couples / संरक्षित जोडपे', 'Count': fpProtected.length },
      { 'Indicator': 'Permanent (Sterilization) / कायमस्वरूपी पद्धत', 'Count': fpPermanent.length },
      { 'Indicator': 'Spacing Methods / तात्पुरती पद्धत', 'Count': fpSpacing.length },
      { 'Indicator': 'Unprotected (No Method) / असंरक्षित जोडपे', 'Count': allEc.length - fpProtected.length },
      { 'Indicator': 'Copper T / IUCD / तांबी', 'Count': allEc.filter(m => ['iud', 'iucd', 'copper_t'].includes((m.healthData?.fpMethod || '').toLowerCase())).length },
      { 'Indicator': 'OC Pills / गर्भनिरोधक गोळ्या', 'Count': allEc.filter(m => m.healthData?.fpMethod === 'ocp').length },
      { 'Indicator': 'Condoms / निरोध', 'Count': allEc.filter(m => m.healthData?.fpMethod === 'condom' || m.healthData?.fpMethod === 'condoms').length },
    ];
    addSheet(wb, 'तक्ता_२', table2Rows);

    // Table 3: ANC & Maternal
    const pregnant = members.filter(m => m.healthData?.isPregnant || m.healthData?.ancStatus === 'active');
    const hrp = pregnant.filter(m => m.healthData?.isHighRisk);
    const table3Rows = [
      { 'Indicator': 'Pregnant Women / गरोदर माता', 'Count': pregnant.length },
      { 'Indicator': 'High Risk Pregnancies / अतिधोकादायक माता', 'Count': hrp.length },
      { 'Indicator': 'Severe Anemia (Hb<7) / तीव्र ॲनिमिया', 'Count': pregnant.filter(m => parseFloat(m.healthData?.hbLevel) < 7 && parseFloat(m.healthData?.hbLevel) > 0).length },
    ];
    addSheet(wb, 'तक्ता_३', table3Rows);

    // Table 4: Child Health
    const children0_5 = members.filter(m => parseInt(m.age) >= 0 && parseInt(m.age) <= 5);
    const table4Rows = [
      { 'Indicator': 'Children 0-5 Years / ० ते ५ वर्षे बालके', 'Count': children0_5.length },
      { 'Indicator': 'Boys / मुलगे', 'Count': children0_5.filter(m => m.gender === 'Male').length },
      { 'Indicator': 'Girls / मुली', 'Count': children0_5.filter(m => m.gender === 'Female').length },
      { 'Indicator': 'SAM Children / तीव्र कुपोषित बालके', 'Count': children0_5.filter(m => m.healthData?.malnutritionStatus === 'SAM' || m.healthData?.malnutritionStatus === 'high_risk').length },
      { 'Indicator': 'MAM Children / मध्यम कुपोषित बालके', 'Count': children0_5.filter(m => m.healthData?.malnutritionStatus === 'MAM' || m.healthData?.malnutritionStatus === 'moderate').length },
    ];
    addSheet(wb, 'तक्ता_४', table4Rows);

    // Table 5: Demographics by age group
    const ageGroup = (min, max) => members.filter(m => parseInt(m.age) >= min && parseInt(m.age) <= max);
    const table5Rows = [
      { 'Age Group / वयोगट': '0-12 months', 'Male / पुरुष': ageGroup(0, 0).filter(m => m.gender === 'Male').length, 'Female / स्त्री': ageGroup(0, 0).filter(m => m.gender === 'Female').length },
      { 'Age Group / वयोगट': '1-5 Years', 'Male / पुरुष': ageGroup(1, 5).filter(m => m.gender === 'Male').length, 'Female / स्त्री': ageGroup(1, 5).filter(m => m.gender === 'Female').length },
      { 'Age Group / वयोगट': '5-10 Years', 'Male / पुरुष': ageGroup(5, 10).filter(m => m.gender === 'Male').length, 'Female / स्त्री': ageGroup(5, 10).filter(m => m.gender === 'Female').length },
      { 'Age Group / वयोगट': '10-19 Years', 'Male / पुरुष': ageGroup(10, 19).filter(m => m.gender === 'Male').length, 'Female / स्त्री': ageGroup(10, 19).filter(m => m.gender === 'Female').length },
      { 'Age Group / वयोगट': '20-39 Years', 'Male / पुरुष': ageGroup(20, 39).filter(m => m.gender === 'Male').length, 'Female / स्त्री': ageGroup(20, 39).filter(m => m.gender === 'Female').length },
      { 'Age Group / वयोगट': '40-60 Years', 'Male / पुरुष': ageGroup(40, 60).filter(m => m.gender === 'Male').length, 'Female / स्त्री': ageGroup(40, 60).filter(m => m.gender === 'Female').length },
      { 'Age Group / वयोगट': '60+ Years', 'Male / पुरुष': ageGroup(61, 200).filter(m => m.gender === 'Male').length, 'Female / स्त्री': ageGroup(61, 200).filter(m => m.gender === 'Female').length },
    ];
    addSheet(wb, 'तक्ता_५', table5Rows);

    // Table 6: Disease Surveillance
    const table6Rows = [
      { 'Indicator': 'TB Suspects / क्षयरोग संशयित', 'Count': members.filter(m => m.healthData?.tbScreening?.hasCoughTwoWeeks || (m.healthData?.tbScreening?.hasFever && m.healthData?.tbScreening?.hasWeightLoss)).length },
      { 'Indicator': 'Malaria Suspects / हिवताप संशयित', 'Count': members.filter(m => m.healthData?.hasFeverWithChills).length },
      { 'Indicator': 'Leprosy Suspects / कुष्ठरोग संशयित', 'Count': members.filter(m => m.healthData?.hasSkinPatches).length },
    ];
    addSheet(wb, 'तक्ता_६', table6Rows);

    const timestamp = new Date().toISOString().split('T')[0];
    const scopeLabel = user?.subCenterName || user?.phcName || user?.name || 'SC';
    const filename = `FamilySurvey_Goshwara_${scopeLabel}_${monthName}_${year}_${timestamp}.xlsx`;
    XLSX.writeFile(wb, filename);
    return true;
  } catch (error) {
    console.error('Family Survey Export Error:', error);
    return false;
  }
};

// Helper to add a sheet to a workbook
const addSheet = (wb, sheetName, rows) => {
  if (!rows || rows.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const keys = Object.keys(rows[0] || {});
  ws['!cols'] = keys.map((k, i) => ({ wch: i === 0 ? 50 : 15 }));
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
};

// Aggregates FP indicators for a set of members/families
const aggregateFPIndicators = (indicators, members, families, allMembers) => {
  const ec = members.filter(m => m.gender === 'Female' && parseInt(m.age) >= 15 && parseInt(m.age) <= 49 && (m.maritalStatus === 'Married' || m.relation === 'Wife' || m.relationToHead === 'Wife'));
  const lookup = {};

  // Caste/category counts
  lookup['Caste SC - Families / सामाजिक प्रवर्ग - अनुसूचित जाती (SC) - कुटुंबे'] = families.filter(f => (f.religionCaste || '').toUpperCase().includes('SC')).length;
  lookup['Caste ST - Families / सामाजिक प्रवर्ग - अनुसूचित जमाती (ST) - कुटुंबे'] = families.filter(f => (f.religionCaste || '').toUpperCase().includes('ST')).length;
  lookup['Caste Other - Families / सामाजिक प्रवर्ग - इतर - कुटुंबे'] = families.filter(f => !(f.religionCaste || '').toUpperCase().match(/SC|ST/)).length;
  lookup['BPL - Families / इतर दारिद्र्य रेषेखालील (BPL) - कुटुंबे (SC/ST वगळून)'] = families.filter(f => f.isBPL && !(f.religionCaste || '').toUpperCase().match(/SC|ST/)).length;

  lookup['Caste SC - Population / सामाजिक प्रवर्ग - अनुसूचित जाती (SC) - लोकसंख्या'] = members.filter(m => { const f = families.find(f => f.id === m.familyId); return (f?.religionCaste || '').toUpperCase().includes('SC'); }).length;
  lookup['Caste ST - Population / सामाजिक प्रवर्ग - अनुसूचित जमाती (ST) - लोकसंख्या'] = members.filter(m => { const f = families.find(f => f.id === m.familyId); return (f?.religionCaste || '').toUpperCase().includes('ST'); }).length;
  lookup['BPL - Population / इतर दारिद्र्य रेषेखालील (BPL) - लोकसंख्या (SC/ST वगळून)'] = members.filter(m => { const f = families.find(f => f.id === m.familyId); return f?.isBPL && !(f?.religionCaste || '').toUpperCase().match(/SC|ST/); }).length;

  // FP methods
  lookup['Protected - Vasectomy / संरक्षित जोडपी - पुरुष नसबंदी'] = members.filter(m => m.gender === 'Male' && m.healthData?.fpMethod === 'vasectomy').length;
  lookup['Protected - Tubectomy / संरक्षित जोडपी - स्त्री नसबंदी'] = ec.filter(m => ['tubectomy', 'permanent'].includes(m.healthData?.fpMethod)).length;
  lookup['Protected - Copper T / संरक्षित जोडपी - तांबी'] = ec.filter(m => ['iud', 'iucd', 'copper_t'].includes((m.healthData?.fpMethod || '').toLowerCase())).length;
  lookup['Protected - OC Pills / संरक्षित जोडपी - गर्भनिरोधक गोळ्या'] = ec.filter(m => m.healthData?.fpMethod === 'ocp').length;
  lookup['Protected - Condoms / संरक्षित जोडपी - निरोध'] = ec.filter(m => ['condom', 'condoms'].includes(m.healthData?.fpMethod)).length;

  // Pregnant women & children
  lookup['Pregnant Women / पाहणीच्या वेळी गरोदर असणाऱ्या स्त्रियांची संख्या'] = members.filter(m => m.healthData?.isPregnant || m.healthData?.ancStatus === 'active').length;
  lookup['Children 0-12 Months / ० ते १२ महिन्यांचे वयोगटातील बालकांची संख्या'] = members.filter(m => parseInt(m.age) === 0).length;
  lookup['Children 13-24 Months / १३ ते २४ महिने पूर्ण वयोगटातील बालकांची संख्या'] = members.filter(m => parseInt(m.age) === 1).length;
  lookup['Children 0-6 Years - Boys / ० ते ६ वर्षे वयोगटातील मुले'] = members.filter(m => parseInt(m.age) <= 6 && m.gender === 'Male').length;
  lookup['Children 0-6 Years - Girls / ० ते ६ वर्षे वयोगटातील मुली'] = members.filter(m => parseInt(m.age) <= 6 && m.gender === 'Female').length;
  lookup['Persons 40-60 Years / ४० वर्षांवरील ते ६० वर्षांखालील व्यक्तींची संख्या'] = members.filter(m => parseInt(m.age) >= 40 && parseInt(m.age) < 60).length;
  lookup['Persons 60+ Years / ६० वर्षांवरील व्यक्तींची संख्या'] = members.filter(m => parseInt(m.age) >= 60).length;

  return lookup;
};

// ===================== HELPERS =====================

const getSheetName = (filterType) => {
  const names = {
    'NEW_ANC': 'ANC_Register',
    'HIGH_RISK_ANC': 'HighRisk_ANC',
    'SEVERE_ANEMIA': 'Severe_Anemia',
    'SAM_CHILDREN': 'SAM_Children',
    'NCD_SCREENING': 'NCD_Screening',
    'ELIGIBLE_COUPLE': 'EC_Register',
    'CHILDREN_0_5': 'Children_0_5',
    'PNC_CASES': 'PNC_Register',
    'PWD': 'PwD_Register',
    'BPL_FAMILIES': 'BPL_Families',
    'PENDING_ANC': 'Pending_ANC',
    'FULLY_IMMUNIZED': 'Fully_Immunized',
    'FP_PERMANENT': 'FP_Permanent',
    'FP_SPACING': 'FP_Spacing',
    'FP_NONE': 'FP_None',
    'TB_SUSPECTS': 'TB_Suspects',
    'MALARIA_SUSPECTS': 'Malaria_Suspects',
    'LEPROSY_SUSPECTS': 'Leprosy_Suspects',
  };
  return names[filterType] || 'Population_Data';
};
