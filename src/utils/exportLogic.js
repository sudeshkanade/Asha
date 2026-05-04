import * as XLSX from 'xlsx';
import { storage, STORAGE_KEYS } from '../database/storage';

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

// ===================== HELPER: Hierarchy filter =====================
const applyHierarchyFilter = (members, user) => {
  if (!user) return members;
  if (user.role === 'ASHA') return members.filter(m => m.villageId === user.villageId);
  if (user.role === 'ANM') return members.filter(m => m.subCenterId === user.subCenterId);
  if (user.role === 'MO') return members.filter(m => m.phcId === user.phcId);
  return members; // Admin sees all
};

// ===================== COLUMN DEFINITIONS =====================

const baseColumns = (m, family, user) => ({
  'Sr.No.': '', // filled later
  'ASHA Name': user?.name || 'N/A',
  'PHC': user?.phcName || m.phcId || 'N/A',
  'Sub-Center': user?.subCenterName || m.subCenterId || 'N/A',
  'Village': m.villageName || family.villageName || 'N/A',
  'House No.': m.houseNo || family.houseNo || 'N/A',
  'Family ID': m.familyId || 'N/A',
  'First Name': m.firstName || '',
  'Middle Name': m.middleName || '',
  'Last Name': m.lastName || '',
  'Relation to Head': m.relation || m.relationToHead || 'N/A',
  'Gender': m.gender || 'N/A',
  'Age': m.age || 'N/A',
  'DOB': m.dob || 'N/A',
  'Marital Status': m.maritalStatus || 'N/A',
  'Education': m.education || 'N/A',
  'Aadhaar': m.aadhaar || 'N/A',
  'ABHA ID': m.abhaId || 'N/A',
  'Mobile': m.mobile || 'N/A',
  'Caste/Category': family.religionCaste || m.caste || 'N/A',
  'BPL': family.isBPL ? 'Yes' : 'No',
  'PwD': m.isPwd ? 'Yes' : 'No',
  'Migrant': m.isMigrant ? 'Yes' : 'No',
  'Status': m.status || 'Active',
});

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
  'Is Pregnant': health.isPregnant ? 'Yes' : 'No',
});

const childColumns = (health) => ({
  'Birth Weight (kg)': health.birthWeight || 'N/A',
  'Delivery Type': health.deliveryType || 'N/A',
  'Place of Delivery': health.placeOfDelivery || 'N/A',
  'Hospital Name': health.hospitalName || 'N/A',
  'Vaccination Status': health.vaccinationStatus || 'N/A',
  'Malnutrition Status': health.malnutritionStatus || 'Normal',
  'Breastfeeding': health.breastfeeding || 'N/A',
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

// ===================== MAIN EXPORT FUNCTION =====================

export const exportMasterPopulation = async (user, filterType = null) => {
  try {
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);

    // 1. Hierarchy filter
    let members = applyHierarchyFilter(allMembers, user);

    // 2. Apply report-specific filter
    if (filterType) {
      members = members.filter(m => {
        const health = m.healthData || {};
        const age = parseInt(m.age);
        switch (filterType) {
          case 'NEW_ANC':
            return !!health.edd || health.isPregnant || health.ancStatus === 'active';
          case 'HIGH_RISK_ANC':
            return !!health.isHighRisk;
          case 'SEVERE_ANEMIA':
            return parseFloat(health.hbLevel) > 0 && parseFloat(health.hbLevel) < 7;
          case 'SAM_CHILDREN':
            return health.malnutritionStatus === 'high_risk' || health.malnutritionStatus === 'SAM';
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
          default:
            return true;
        }
      });
    }

    // 3. Build rows with appropriate columns per report type
    const flatData = members.map((m, index) => {
      const family = allFamilies.find(f => f.id === m.familyId) || {};
      const health = m.healthData || {};
      const base = baseColumns(m, family, user);
      base['Sr.No.'] = index + 1;

      switch (filterType) {
        case 'NEW_ANC':
        case 'HIGH_RISK_ANC':
        case 'SEVERE_ANEMIA':
          return { ...base, ...ancColumns(health) };
        case 'SAM_CHILDREN':
        case 'CHILDREN_0_5':
          return { ...base, ...childColumns(health) };
        case 'ELIGIBLE_COUPLE':
          return { ...base, ...fpColumns(health), ...ancColumns(health) };
        case 'NCD_SCREENING':
          return { ...base, ...ncdColumns(health) };
        case 'PNC_CASES':
          return { ...base, ...pncColumns(health), ...childColumns(health) };
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

export const exportVitalEvents = async (user, eventType = 'Birth') => {
  try {
    const events = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);

    const vitalEvents = events
      .filter(e => e.tableName === 'vital_events')
      .map(e => e.payload || e)
      .filter(p => p.type === eventType);

    let rows;
    if (eventType === 'Birth') {
      rows = vitalEvents.map((e, i) => ({
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
        'Village': allMembers.find(m => m.id === e.motherId)?.villageName || 'N/A',
        'House No.': allMembers.find(m => m.id === e.motherId)?.houseNo || 'N/A',
      }));
    } else {
      rows = vitalEvents.map((e, i) => {
        const member = allMembers.find(m => m.id === e.memberId) || {};
        return {
          'Sr.No.': i + 1,
          'Date of Death': e.date || 'N/A',
          'Name': e.name || `${member.firstName || ''} ${member.lastName || ''}`,
          'Gender': member.gender || 'N/A',
          'Age': member.age || 'N/A',
          'Cause of Death': e.cause || e.causeOfDeath || 'N/A',
          'Village': member.villageName || 'N/A',
          'House No.': member.houseNo || 'N/A',
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
    const sessions = events
      .filter(e => e.tableName === 'vhnd_sessions')
      .map((e, i) => {
        const p = e.payload || e;
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

    const rows = ecMembers.map((m, i) => {
      const family = allFamilies.find(f => f.id === m.familyId) || {};
      const health = m.healthData || {};
      return {
        'Sr.No.': i + 1,
        'Village': m.villageName || family.villageName || 'N/A',
        'House No.': m.houseNo || family.houseNo || 'N/A',
        'Wife Name': `${m.firstName || ''} ${m.lastName || ''}`,
        'Age': m.age || 'N/A',
        'Husband Name': m.middleName || 'N/A',
        'No. of Children': 'N/A', // Future: count children in same family
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
  };
  return names[filterType] || 'Population_Data';
};
