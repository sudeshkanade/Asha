import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
  Platform,
  Modal
} from 'react-native';
import { COLORS } from '../constants/colors';
import { calculateChildSchedule, shouldShowMaternalFields, ANC_RISK_FACTORS, calculateVaccinationSchedule } from '../utils/healthLogic';
import { storage, STORAGE_KEYS } from '../database/storage';
import { incentiveManager } from '../utils/incentiveManager';
import { generateAlert } from '../utils/alertLogic';
import { useTranslation } from 'react-i18next';

const RenderInput = ({ label, value, onChange, placeholder, keyboardType = 'default' }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={placeholder} keyboardType={keyboardType} />
  </View>
);

const HealthTrackerScreen = ({ member, taskId, user, onSave, onBack, initialTab }) => {
  const { t } = useTranslation();
  const [tracker, setTracker] = useState({
    ancStatus: member?.healthData?.ancStatus || 'none',
    edd: member?.healthData?.edd || '',
    isHighRisk: member?.healthData?.isHighRisk || false,
    selectedRiskFactors: member?.healthData?.selectedRiskFactors || [],
    bpSystolic: member?.healthData?.bpSystolic || '',
    bpDiastolic: member?.healthData?.bpDiastolic || '',
    sugarLevel: member?.healthData?.sugarLevel || '',
    hbLevel: member?.healthData?.hbLevel || '',
    heartRate: member?.healthData?.heartRate || '',
    weight: member?.healthData?.weight || '',
    height: member?.healthData?.height || '',
    muac: member?.healthData?.muac || '',
    vaccinationStatus: member?.healthData?.vaccinationStatus || 'Incomplete',
    fpMethod: member?.healthData?.fpMethod || 'none',
    usesTobacco: member?.healthData?.usesTobacco || false,
    usesAlcohol: member?.healthData?.usesAlcohol || false,
    lmp: member?.healthData?.lmp || '',
    tbScreening: {
      hasCoughTwoWeeks: member?.healthData?.tbScreening?.hasCoughTwoWeeks || false,
      hasFever: member?.healthData?.tbScreening?.hasFever || false,
      hasNightSweats: member?.healthData?.tbScreening?.hasNightSweats || false,
      hasWeightLoss: member?.healthData?.tbScreening?.hasWeightLoss || false, // BUG-TB-01 FIX: was missing
    },
    hasFeverWithChills: member?.healthData?.hasFeverWithChills || false,
    hasSkinPatches: member?.healthData?.hasSkinPatches || false,
    hasDiarrhea: member?.healthData?.hasDiarrhea || false,
    onTbTreatment: member?.healthData?.onTbTreatment || false,
    // ANC/PNC Diagnostics & Medication
    bloodGroup: member?.healthData?.bloodGroup || 'unknown',
    hivScreening: member?.healthData?.hivScreening || 'not_done',
    vdrlScreening: member?.healthData?.vdrlScreening || 'not_done',
    tshScreening: member?.healthData?.tshScreening || 'not_done',
    urineRoutine: member?.healthData?.urineRoutine || 'not_done',
    ifaQuantity: member?.healthData?.ifaQuantity || '0',
    calciumQuantity: member?.healthData?.calciumQuantity || '0',
    usgDate: member?.healthData?.usgDate || '',
    usgAnomalies: member?.healthData?.usgAnomalies || 'none',
    motherPncSigns: member?.healthData?.motherPncSigns || 'none',
    babyPncSigns: member?.healthData?.babyPncSigns || 'none',
    // Child Milestones & Vitamin A / Deworming
    childMilestones: member?.healthData?.childMilestones || 'none',
    exclusiveBreastfeeding: member?.healthData?.exclusiveBreastfeeding ?? true,
    vitaminADose: member?.healthData?.vitaminADose || 'none',
    dewormingDone: member?.healthData?.dewormingDone ?? false,
    // Cancer Screening, CBAC & NCD Compliance / Infection Lab Results
    cancerOral: member?.healthData?.cancerOral || 'normal',
    cancerBreast: member?.healthData?.cancerBreast || 'normal',
    cancerCervical: member?.healthData?.cancerCervical || 'normal',
    cbacScore: member?.healthData?.cbacScore || '0',
    ncdMedicationCompliance: member?.healthData?.ncdMedicationCompliance ?? true,
    tbLabResult: member?.healthData?.tbLabResult || 'not_screened',
    malariaLabResult: member?.healthData?.malariaLabResult || 'not_screened',
    // FP Spacing History & Injectable Date
    fpContraceptiveHistory: member?.healthData?.fpContraceptiveHistory || 'none',
    nextInjectableDate: member?.healthData?.nextInjectableDate || '',
    tdVaccine: member?.healthData?.tdVaccine || 'None',
    gestationalComplication: member?.healthData?.gestationalComplication || 'None',
    hasAefi: member?.healthData?.hasAefi || false,
    aefiDetails: member?.healthData?.aefiDetails || '',
  });

  const hbncSchedule = member?.dob ? calculateChildSchedule(member.dob).hbnc : [];
  const vaccinationSchedule = member?.dob ? calculateVaccinationSchedule(member.dob) : [];
  const memberAge = parseInt(member?.age) || 0;
  const showMaternal = member ? shouldShowMaternalFields(member.gender, memberAge) : true;
  const isEC = member?.gender === 'Female' && memberAge >= 15 && memberAge <= 49 && !member?.healthData?.isPregnant;
  const isChild = memberAge < 17;

  const weightVal = parseFloat(tracker.weight) || (member?.healthData?.weight ? parseFloat(member.healthData.weight) : NaN);
  const heightVal = parseFloat(tracker.height) || (member?.healthData?.height ? parseFloat(member.healthData.height) : NaN);
  
  const bmi = !isNaN(weightVal) && !isNaN(heightVal) && heightVal > 0
    ? (weightVal / Math.pow(heightVal / 100, 2)).toFixed(1)
    : null;

  const bmiCategory = bmi
    ? bmi < 18.5 ? { label: t('underweight', 'Underweight'), color: '#F59E0B' }
    : bmi < 25   ? { label: t('normal', 'Normal'),      color: '#10B981' }
    : bmi < 30   ? { label: t('overweight', 'Overweight'),  color: '#F59E0B' }
    :               { label: t('obese', 'Obese'),       color: '#EF4444' }
    : null;

  const calculateGestationalWeeks = () => {
    if (!tracker.lmp || tracker.lmp.length !== 10) return null;
    const parts = tracker.lmp.split('/');
    if (parts.length !== 3) return null;
    const lmpDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    if (isNaN(lmpDate.getTime())) return null;
    
    const diffMs = new Date() - lmpDate;
    const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    
    let trimester = '';
    if (weeks <= 12) trimester = '1st Trimester';
    else if (weeks <= 28) trimester = '2nd Trimester';
    else trimester = '3rd Trimester';
    
    return { weeks, trimester };
  };

  const ga = calculateGestationalWeeks();

  const tabs = [];
  if (showMaternal) tabs.push('ANC');
  if (isChild) tabs.push('CHILD');
  if (!isChild) tabs.push('NCD');
  if (isEC) tabs.push('FP');

  const [activeTab, setActiveTab] = useState(initialTab && tabs.includes(initialTab) ? initialTab : (tabs[0] || 'NCD'));
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [downgradeReason, setDowngradeReason] = useState('');

  const fpMethods = [
    { label: t('none'), value: 'none' },
    { label: t('permanent'), value: 'permanent' },
    { label: t('condom'), value: 'condom' },
    { label: t('ocp'), value: 'ocp' },
    { label: t('iud'), value: 'iud' },
    { label: t('injectable'), value: 'injectable' },
  ];

  const checkRedFlags = () => {
    const alerts = [];
    if (parseInt(tracker.bpSystolic) > 140 || parseInt(tracker.bpDiastolic) > 90) {
      alerts.push('⚠️ ' + t('highRisk') + ' BP DETECTED (' + tracker.bpSystolic + '/' + tracker.bpDiastolic + '). Refer to PHC immediately.');
    }
    if (parseFloat(tracker.hbLevel) > 0 && parseFloat(tracker.hbLevel) < 7) {
      alerts.push('🚨 ' + t('severeAnemiaHb') + ' (Hb: ' + tracker.hbLevel + '). Immediate iron supplementation and referral required.');
    }
    if (tracker.tbScreening.hasCoughTwoWeeks || (tracker.tbScreening.hasFever && tracker.tbScreening.hasWeightLoss)) {
      alerts.push('🧪 ' + t('tbSuspectAlert', 'TB Suspect Detected! Sputum collection task has been generated.'));
    }
    if (tracker.hasFeverWithChills) {
      alerts.push('🦟 ' + t('malariaSuspectAlert', 'Malaria Suspect Detected! Blood slide collection task generated.'));
    }
    if (tracker.hasSkinPatches) {
      alerts.push('⚪ ' + t('leprosySuspectAlert', 'Leprosy Suspect (Skin Patches)! Please refer for specialist examination.'));
    }
    if (tracker.hasDiarrhea && memberAge < 5) {
      alerts.push('💧 ' + t('diarrheaAlert', 'Child has Diarrhea. Provide ORS/Zinc and demonstrate preparation.'));
    }
    return alerts;
  };

  const persistData = async (justification = '') => {
    const isRedFlag = (parseInt(tracker.bpSystolic) > 140 || parseInt(tracker.bpDiastolic) > 90) || 
                      (parseFloat(tracker.hbLevel) > 0 && parseFloat(tracker.hbLevel) < 7) || 
                      (memberAge <= 5 && parseFloat(tracker.weight) > 0 && parseFloat(tracker.weight) < 10) ||
                      (memberAge <= 5 && parseFloat(tracker.muac) > 0 && parseFloat(tracker.muac) < 11.5);
    const finalIsHighRisk = tracker.selectedRiskFactors.length > 0 || isRedFlag;
    
    // RUTHLESS FIX: Detect Downgrade for Audit
    const isDowngrade = member?.healthData?.isHighRisk === true && finalIsHighRisk === false;

    const completedTasks = [...(member?.healthData?.completedTasks || [])];
    if (taskId && !completedTasks.includes(taskId)) {
      completedTasks.push(taskId);
    }

    const updatedMember = {
      ...member,
      healthData: { 
        ...member?.healthData, 
        ...tracker, 
        isHighRisk: finalIsHighRisk,
        completedTasks: completedTasks,
        lastUpdatedAt: Date.now(),
        // RUTHLESS FIX: Audit Trail for Overrides
        _governance: isDowngrade ? {
           type: 'RISK_DOWNGRADE',
           authorizedBy: user?.name || user?.id,
           timestamp: new Date().toISOString(),
           reason: justification || 'Emergency clinical correction'
        } : member?.healthData?._governance
      },
    };

    // Separate Governance Log for PHC Audit
    if (isDowngrade) {
      await storage.save('governance_logs', {
        id: storage.generateId('gov', user?.id),
        type: 'RISK_DOWNGRADE',
        targetMember: member.id,
        user: user?.name || user?.id,
        reason: justification,
        timestamp: new Date().toISOString()
      });
    }

    await storage.save(STORAGE_KEYS.MEMBERS, updatedMember);
    
    // Alert logic for ANM/CHO
    if (user?.role === 'ASHA') {
      if (finalIsHighRisk) {
        let msg = `High Risk Case Updated: ${member.firstName} ${member.lastName}`;
        if (parseFloat(tracker.hbLevel) > 0 && parseFloat(tracker.hbLevel) < 7) {
          msg = `Severe Anemia (Hb < 7) Detected: ${member.firstName} ${member.lastName}`;
        }
        await generateAlert({
          type: 'HIGH_RISK_ANC',
          message: msg,
          user: user,
          memberId: member.id,
          targetRoles: ['ANM', 'CHO', 'MO']
        });
      }

      if (memberAge <= 5 && parseFloat(tracker.muac) > 0 && parseFloat(tracker.muac) < 11.5) {
        await generateAlert({
          type: 'SAM_CHILD',
          message: `SAM Child Detected (MUAC < 11.5): ${member.firstName} ${member.lastName}`,
          user: user,
          memberId: member.id,
          targetRoles: ['ANM', 'CHO', 'MO']
        });
      }
    }

    // RED TEAM FIX: Trigger atomic incentive generation
    if (user?.role === 'ASHA') {
      await incentiveManager.processMemberTriggers(updatedMember, user);
    }

    if (onSave) onSave(updatedMember);
    else if (onBack) onBack();
  };

  const isPeriodLocked = async () => {
    try {
      // FIX: LOCKED_PERIODS is a JSON array managed by storage.getAll (not a raw string).
      // Using getRaw + .includes() did unreliable substring matching on the JSON string.
      const lockedPeriods = await storage.getAll(STORAGE_KEYS.LOCKED_PERIODS);
      const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      return lockedPeriods.some(p => p.id === currentMonth);
    } catch (e) {
      return false;
    }
  };

  const handleSave = async () => {
    const locked = await isPeriodLocked();
    if (locked) {
      if (Platform.OS === 'web') window.alert(t('periodLockedError', 'This reporting period is locked. Clinical data cannot be modified.'));
      else Alert.alert(t('error', 'Error'), t('periodLockedError', 'This reporting period is locked. Clinical data cannot be modified.'));
      return;
    }

    const showError = (msg) => {
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert(t('error'), msg);
    };

    const parseDdMmYyyy = (str) => {
      const parts = str.split('/');
      if (parts.length !== 3) return null;
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) {
        return null;
      }
      return date;
    };

    const parseYyyyMmDd = (str) => {
      const parts = str.split('-');
      if (parts.length !== 3) return null;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) {
        return null;
      }
      return date;
    };

    const today = new Date();
    today.setHours(0,0,0,0);

    // 1. ANC TAB VALIDATION
    if (activeTab === 'ANC' && showMaternal) {
      if (tracker.lmp) {
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(tracker.lmp)) {
          showError(t('invalidLmpFormat', 'Invalid LMP format. Use DD/MM/YYYY.'));
          return;
        }
        const lmpDate = parseDdMmYyyy(tracker.lmp);
        if (!lmpDate) {
          showError(t('invalidLmp', 'Invalid LMP date. Please check days and months.'));
          return;
        }
        if (lmpDate > today) {
          showError(t('lmpInFuture', 'LMP date cannot be in the future.'));
          return;
        }
        const diffMs = today - lmpDate;
        const diffDays = diffMs / (24 * 60 * 60 * 1000);
        if (diffDays > 280) {
          showError(t('lmpTooOld', 'LMP date cannot be older than 280 days (9.3 months).'));
          return;
        }
      }

      if (!tracker.bpSystolic || !tracker.bpSystolic.trim()) {
        showError(t('bpSystolicRequired', 'BP Systolic is required.'));
        return;
      }

      const sys = parseInt(tracker.bpSystolic, 10);
      if (isNaN(sys) || sys < 50 || sys > 250) {
        showError(t('invalidSystolic', 'BP Systolic must be between 50 and 250 mmHg.'));
        return;
      }

      if (tracker.bpDiastolic) {
        const dia = parseInt(tracker.bpDiastolic, 10);
        if (isNaN(dia) || dia < 30 || dia > 150) {
          showError(t('invalidDiastolic', 'BP Diastolic must be between 30 and 150 mmHg.'));
          return;
        }
        if (sys <= dia) {
          showError(t('systolicDiastolicComparison', 'BP Systolic must be greater than BP Diastolic.'));
          return;
        }
      }

      if (tracker.hbLevel) {
        const hb = parseFloat(tracker.hbLevel);
        if (isNaN(hb) || hb < 1.0 || hb > 25.0) {
          showError(t('invalidHb', 'Hb Level must be between 1.0 and 25.0 gm%.'));
          return;
        }
      }

      if (tracker.weight) {
        const w = parseFloat(tracker.weight);
        if (isNaN(w) || w < 20.0 || w > 250.0) {
          showError(t('invalidWeight', 'Weight must be a valid decimal between 20.0 and 250.0 kg.'));
          return;
        }
      }

      if (tracker.ifaQuantity) {
        const ifa = parseInt(tracker.ifaQuantity, 10);
        if (isNaN(ifa) || ifa < 0) {
          showError(t('invalidIfaQty', 'IFA Tablets quantity must be a non-negative integer.'));
          return;
        }
      }

      if (tracker.calciumQuantity) {
        const calc = parseInt(tracker.calciumQuantity, 10);
        if (isNaN(calc) || calc < 0) {
          showError(t('invalidCalciumQty', 'Calcium Tablets quantity must be a non-negative integer.'));
          return;
        }
      }

      if (tracker.usgDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(tracker.usgDate)) {
          showError(t('invalidUsgFormat', 'USG scan date must be in YYYY-MM-DD format.'));
          return;
        }
        const usgDate = parseYyyyMmDd(tracker.usgDate);
        if (!usgDate) {
          showError(t('invalidUsgDate', 'Invalid USG scan date. Please verify year, month, and day.'));
          return;
        }
        if (usgDate > today) {
          showError(t('usgInFuture', 'USG scan date cannot be in the future.'));
          return;
        }
      }
    }

    // 2. CHILD TAB VALIDATION
    if (activeTab === 'CHILD' && isChild) {
      if (tracker.weight) {
        const w = parseFloat(tracker.weight);
        if (isNaN(w) || w < 0.5 || w > 100.0) {
          showError(t('invalidChildWeight', 'Child weight must be a valid decimal between 0.5 and 100.0 kg.'));
          return;
        }
      }

      if (tracker.height) {
        const h = parseFloat(tracker.height);
        if (isNaN(h) || h < 20.0 || h > 180.0) {
          showError(t('invalidChildHeight', 'Child height must be a valid decimal between 20.0 and 180.0 cm.'));
          return;
        }
      }

      if (tracker.muac) {
        const m = parseFloat(tracker.muac);
        if (isNaN(m) || m < 5.0 || m > 25.0) {
          showError(t('invalidChildMuac', 'MUAC must be a valid decimal between 5.0 and 25.0 cm.'));
          return;
        }
      }
    }

    // 3. NCD TAB VALIDATION
    if (activeTab === 'NCD' && !isChild) {
      if (tracker.bpSystolic) {
        const sys = parseInt(tracker.bpSystolic, 10);
        if (isNaN(sys) || sys < 50 || sys > 250) {
          showError(t('invalidSystolic', 'BP Systolic must be between 50 and 250 mmHg.'));
          return;
        }

        if (tracker.bpDiastolic) {
          const dia = parseInt(tracker.bpDiastolic, 10);
          if (isNaN(dia) || dia < 30 || dia > 150) {
            showError(t('invalidDiastolic', 'BP Diastolic must be between 30 and 150 mmHg.'));
            return;
          }
          if (sys <= dia) {
            showError(t('systolicDiastolicComparison', 'BP Systolic must be greater than BP Diastolic.'));
            return;
          }
        }
      }

      if (tracker.sugarLevel) {
        const sug = parseInt(tracker.sugarLevel, 10);
        if (isNaN(sug) || sug < 20 || sug > 800) {
          showError(t('invalidSugar', 'Blood Sugar must be a number between 20 and 800 mg/dL.'));
          return;
        }
      }

      if (tracker.heartRate) {
        const hr = parseInt(tracker.heartRate, 10);
        if (isNaN(hr) || hr < 30 || hr > 250) {
          showError(t('invalidHeartRate', 'Heart Rate must be a number between 30 and 250 bpm.'));
          return;
        }
      }

      if (tracker.hbLevel) {
        const hb = parseFloat(tracker.hbLevel);
        if (isNaN(hb) || hb < 1.0 || hb > 25.0) {
          showError(t('invalidHb', 'Hb Level must be between 1.0 and 25.0 gm%.'));
          return;
        }
      }

      if (tracker.weight) {
        const w = parseFloat(tracker.weight);
        if (isNaN(w) || w < 20.0 || w > 250.0) {
          showError(t('invalidWeight', 'Weight must be a valid decimal between 20.0 and 250.0 kg.'));
          return;
        }
      }

      if (tracker.cbacScore) {
        const cbac = parseInt(tracker.cbacScore, 10);
        if (isNaN(cbac) || cbac < 0 || cbac > 20) {
          showError(t('invalidCbac', 'CBAC Risk Score must be an integer between 0 and 20.'));
          return;
        }
      }
    }

    // 4. FP TAB VALIDATION
    if (activeTab === 'FP' && isEC) {
      if (tracker.fpMethod === 'injectable' && tracker.nextInjectableDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(tracker.nextInjectableDate)) {
          showError(t('invalidNextInjectableFormat', 'Next Injectable Date must be in YYYY-MM-DD format.'));
          return;
        }
        const nextInj = parseYyyyMmDd(tracker.nextInjectableDate);
        if (!nextInj) {
          showError(t('invalidNextInjectableDate', 'Invalid Next Injectable Date. Please verify year, month, and day.'));
          return;
        }
      }
    }

    const isRedFlag = (parseInt(tracker.bpSystolic) > 140 || parseInt(tracker.bpDiastolic) > 90) || 
                      (parseFloat(tracker.hbLevel) > 0 && parseFloat(tracker.hbLevel) < 7);
    const finalIsHighRisk = tracker.selectedRiskFactors.length > 0 || isRedFlag;
    const isDowngrade = member?.healthData?.isHighRisk === true && finalIsHighRisk === false;

    if (isDowngrade) {
      setDowngradeReason('');
      setShowDowngradeModal(true);
      return;
    }

    const redFlags = checkRedFlags();
    if (redFlags.length > 0) {
      if (Platform.OS === 'web') {
        if (window.confirm('🚨 ' + t('clinicalAlert') + '\n\n' + redFlags.join('\n\n') + '\n\n' + t('ackAndSaveConfirm'))) {
          persistData();
        }
      } else {
        Alert.alert('🚨 ' + t('clinicalAlert'), redFlags.join('\n\n'), [
          { text: t('cancel'), style: 'cancel' },
          { text: t('ackAndSave'), onPress: () => persistData() }
        ]);
      }
    } else {
      persistData();
    }
  };

  const handleConfirmDowngrade = () => {
    if (!downgradeReason.trim()) {
      Alert.alert(t('required', 'Required'), t('justificationMandatory', 'Justification is mandatory for risk downgrades.'));
      return;
    }
    setShowDowngradeModal(false);

    const redFlags = checkRedFlags();
    if (redFlags.length > 0) {
      if (Platform.OS === 'web') {
        if (window.confirm('🚨 ' + t('clinicalAlert') + '\n\n' + redFlags.join('\n\n') + '\n\n' + t('ackAndSaveConfirm'))) {
          persistData(downgradeReason);
        }
      } else {
        Alert.alert('🚨 ' + t('clinicalAlert'), redFlags.join('\n\n'), [
          { text: t('cancel'), style: 'cancel' },
          { text: t('ackAndSave'), onPress: () => persistData(downgradeReason) }
        ]);
      }
    } else {
      persistData(downgradeReason);
    }
  };

  const toggleRiskFactor = (factor) => {
    const current = tracker.selectedRiskFactors;
    const updated = current.includes(factor)
      ? current.filter(f => f !== factor)
      : [...current, factor];
    setTracker({ ...tracker, selectedRiskFactors: updated, isHighRisk: updated.length > 0 });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{member?.firstName} {member?.lastName}</Text>
          <Text style={styles.headerSubtitle}>{t('houseNo')}: {member?.houseNo} • {member?.gender} • {t('age')}: {member?.age}</Text>
        </View>
      </View>

      <View style={styles.tabBarContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'ANC' ? t('ancDetails') : tab === 'CHILD' ? t('childHealth') : tab === 'FP' ? t('familyPlanning') : t('ncdScreening')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'ANC' && showMaternal && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('ancDetails')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('lmp')} - DD/MM/YYYY</Text>
              <TextInput style={styles.input} value={tracker.lmp}
                onChangeText={(t) => {
                  let cleaned = t.replace(/[^\d/]/g, '');
                  if (cleaned.length === 2 && !tracker.lmp?.endsWith('/')) cleaned += '/';
                  else if (cleaned.length === 5 && !tracker.lmp?.endsWith('/')) cleaned += '/';
                  
                  let newEdd = tracker.edd;
                  if (cleaned.length === 10) {
                    const parts = cleaned.split('/');
                    if (parts.length === 3) {
                      // LOGIC-8 FIX: new Date('YYYY-MM-DD') parses as UTC midnight.
                      // In IST (+5:30), converting back via .toISOString() can shift
                      // the date backwards by 1 day. Use the local Date constructor
                      // (new Date(y, m, d)) which operates entirely in local time.
                      const [day, mon, yr] = parts.map(Number);
                      const lmpDate = new Date(yr, mon - 1, day); // local time
                      if (!isNaN(lmpDate.getTime())) {
                        lmpDate.setDate(lmpDate.getDate() + 280);
                        // Format YYYY-MM-DD in local time (not UTC)
                        const y = lmpDate.getFullYear();
                        const m = String(lmpDate.getMonth() + 1).padStart(2, '0');
                        const d = String(lmpDate.getDate()).padStart(2, '0');
                        newEdd = `${y}-${m}-${d}`;
                      }
                    }
                  }
                  setTracker({ ...tracker, lmp: cleaned, edd: newEdd });
                }}
                placeholder="DD/MM/YYYY" keyboardType="numeric" maxLength={10} />
            </View>
            
            {tracker.edd ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '600', marginBottom: 4 }}>
                  {t('autoEdd')}: {tracker.edd}
                </Text>
                {ga && (
                  <Text style={{ fontSize: 13, color: COLORS.secondary, fontWeight: '700' }}>
                    {t('gestationalAge', 'Gestational Age')}: {ga.weeks} {t('weeks', 'weeks')} ({t(ga.trimester.toLowerCase().replace(/ /g, ''), ga.trimester)})
                  </Text>
                )}
              </View>
            ) : null}

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, minWidth: 120 }]}>
                <Text style={styles.label}>{t('bpSystolic', 'BP Systolic')} <Text style={styles.required}>*</Text></Text>
                <TextInput style={styles.input} value={tracker.bpSystolic}
                  onChangeText={(t) => setTracker({ ...tracker, bpSystolic: t })}
                  placeholder="120" keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1, minWidth: 120 }]}>
                <Text style={styles.label}>{t('bpDiastolic', 'BP Diastolic')}</Text>
                <TextInput style={styles.input} value={tracker.bpDiastolic}
                  onChangeText={(t) => setTracker({ ...tracker, bpDiastolic: t })}
                  placeholder="80" keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, minWidth: 120 }]}>
                <Text style={styles.label}>{t('hbLevel')}</Text>
                <TextInput style={styles.input} value={tracker.hbLevel}
                  onChangeText={(t) => setTracker({ ...tracker, hbLevel: t })}
                  placeholder="11.5" keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1, minWidth: 120 }]}>
                <Text style={styles.label}>{t('weightKg', 'Weight (kg)')}</Text>
                <TextInput style={styles.input} value={tracker.weight}
                  onChangeText={(t) => setTracker({ ...tracker, weight: t })}
                  placeholder="55" keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('ancDiagnosticPanel', 'Antenatal Diagnostics Panel')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('bloodGroup', 'Blood Group')}</Text>
              <View style={styles.pickerContainer}>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'].map((bg) => (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.chip, tracker.bloodGroup === bg && styles.chipActive]}
                    onPress={() => setTracker({ ...tracker, bloodGroup: bg })}
                  >
                    <Text style={[styles.chipText, tracker.bloodGroup === bg && styles.chipTextActive]}>{t(bg, bg)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('hivScreening', 'HIV Screening')}</Text>
              <View style={styles.pickerContainer}>
                {['Non-Reactive', 'Reactive', 'Not Done'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, tracker.hivScreening === opt && styles.chipActive]}
                    onPress={() => setTracker({ ...tracker, hivScreening: opt })}
                  >
                    <Text style={[styles.chipText, tracker.hivScreening === opt && styles.chipTextActive]}>{t(opt, opt)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('vdrlScreening', 'Syphilis (VDRL) Screening')}</Text>
              <View style={styles.pickerContainer}>
                {['Non-Reactive', 'Reactive', 'Not Done'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, tracker.vdrlScreening === opt && styles.chipActive]}
                    onPress={() => setTracker({ ...tracker, vdrlScreening: opt })}
                  >
                    <Text style={[styles.chipText, tracker.vdrlScreening === opt && styles.chipTextActive]}>{t(opt, opt)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('tshScreening', 'Thyroid (TSH) Screening')}</Text>
              <View style={styles.pickerContainer}>
                {['Normal', 'High', 'Low', 'Not Done'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, tracker.tshScreening === opt && styles.chipActive]}
                    onPress={() => setTracker({ ...tracker, tshScreening: opt })}
                  >
                    <Text style={[styles.chipText, tracker.tshScreening === opt && styles.chipTextActive]}>{t(opt, opt)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('urineRoutine', 'Urine Test (Routine)')}</Text>
              <View style={styles.pickerContainer}>
                {['Normal', 'Albumin Present', 'Sugar Present', 'Albumin & Sugar', 'Not Done'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, tracker.urineRoutine === opt && styles.chipActive]}
                    onPress={() => setTracker({ ...tracker, urineRoutine: opt })}
                  >
                    <Text style={[styles.chipText, tracker.urineRoutine === opt && styles.chipTextActive]}>{t(opt, opt)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('ancMedicines', 'Medicines & Distribution')}</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, minWidth: 140 }]}>
                <Text style={styles.label}>{t('ifaQuantity', 'IFA Tablets Distributed')}</Text>
                <TextInput style={styles.input} value={tracker.ifaQuantity}
                  onChangeText={(t) => setTracker({ ...tracker, ifaQuantity: t })}
                  placeholder="e.g. 30" keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1, minWidth: 140 }]}>
                <Text style={styles.label}>{t('calciumQuantity', 'Calcium Tablets Distributed')}</Text>
                <TextInput style={styles.input} value={tracker.calciumQuantity}
                  onChangeText={(t) => setTracker({ ...tracker, calciumQuantity: t })}
                  placeholder="e.g. 60" keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('ancImmunization', 'Maternal Immunization (Td)')}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('tdVaccineStatus', 'Td Vaccine Status')}</Text>
              <View style={styles.pickerContainer}>
                {['None', 'Td 1', 'Td 2', 'Td Booster'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, tracker.tdVaccine === opt && styles.chipActive]}
                    onPress={() => setTracker({ ...tracker, tdVaccine: opt })}
                  >
                    <Text style={[styles.chipText, tracker.tdVaccine === opt && styles.chipTextActive]}>{t(opt, opt)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('ancUsgTracking', 'Ultrasound (USG) Scan')}</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, minWidth: 140 }]}>
                <Text style={styles.label}>{t('usgDate', 'Scan Date (YYYY-MM-DD)')}</Text>
                <TextInput style={styles.input} value={tracker.usgDate}
                  onChangeText={(t) => setTracker({ ...tracker, usgDate: t })}
                  placeholder="YYYY-MM-DD" />
              </View>
              <View style={[styles.inputGroup, { flex: 1, minWidth: 140 }]}>
                <Text style={styles.label}>{t('usgAnomalies', 'Fetal Anomalies')}</Text>
                <View style={styles.pickerContainer}>
                  {['None', 'Anomalies Found'].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.chip, tracker.usgAnomalies === opt && styles.chipActive]}
                      onPress={() => setTracker({ ...tracker, usgAnomalies: opt })}
                    >
                      <Text style={[styles.chipText, tracker.usgAnomalies === opt && styles.chipTextActive]}>{t(opt, opt)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {(member?.healthData?.pncStatus === 'Pending' || member?.healthData?.pncStatus === 'active') && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>{t('pncWarningSigns', 'Postnatal Warning Signs')}</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('motherPncSigns', 'Mother PNC Warning Signs')}</Text>
                  <View style={styles.pickerContainer}>
                    {['None', 'Bleeding', 'Fever', 'Breast Discharge', 'Foul Discharge'].map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.chip, tracker.motherPncSigns === opt && styles.chipActive]}
                        onPress={() => setTracker({ ...tracker, motherPncSigns: opt })}
                      >
                        <Text style={[styles.chipText, tracker.motherPncSigns === opt && styles.chipTextActive]}>{t(opt, opt)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('babyPncSigns', 'Baby PNC Warning Signs')}</Text>
                  <View style={styles.pickerContainer}>
                    {['None', 'Convulsions', 'Fast Breathing', 'Jaundice', 'Cold Body', 'Fever'].map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.chip, tracker.babyPncSigns === opt && styles.chipActive]}
                        onPress={() => setTracker({ ...tracker, babyPncSigns: opt })}
                      >
                        <Text style={[styles.chipText, tracker.babyPncSigns === opt && styles.chipTextActive]}>{t(opt, opt)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('gestationalComplications', 'Gestational Complications')}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('gestationalOutcome', 'Gestational Outcome / Complication')}</Text>
              <View style={styles.pickerContainer}>
                {['None', 'Abortion', 'Stillbirth', 'PPH', 'Eclampsia', 'Sepsis'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, tracker.gestationalComplication === opt && styles.chipActive]}
                    onPress={() => setTracker({ ...tracker, gestationalComplication: opt })}
                  >
                    <Text style={[styles.chipText, tracker.gestationalComplication === opt && styles.chipTextActive]}>{t(opt, opt)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('riskStatus')}</Text>
            {ANC_RISK_FACTORS.map((factor, i) => (
              <TouchableOpacity key={i} style={styles.riskRow} onPress={() => toggleRiskFactor(factor)}>
                <View style={[styles.checkbox, tracker.selectedRiskFactors.includes(factor) && styles.checkboxActive]}>
                  {tracker.selectedRiskFactors.includes(factor) && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.riskLabel}>{t(factor.toLowerCase().replace(/[^a-z]/g, '')) || factor}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'ANC' && !showMaternal && (
          <View style={styles.card}>
            <Text style={styles.emptyText}>{t('ancFemaleOnlyNotice', 'ANC tracking is available for females aged 15-49.')}</Text>
          </View>
        )}

        {activeTab === 'CHILD' && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('growthMonitoring', 'Growth Monitoring')}</Text>
              <RenderInput label={t('weight') + ' (kg)'} value={tracker.weight} onChange={(t) => setTracker({...tracker, weight: t})} placeholder="e.g. 10.5" keyboardType="numeric" />
              <RenderInput label={t('height') + ' (cm)'} value={tracker.height} onChange={(t) => setTracker({...tracker, height: t})} placeholder="e.g. 85" keyboardType="numeric" />
              
              {bmi && (
                <View style={{ 
                  padding: 12, 
                  backgroundColor: bmiCategory.color + '20',
                  borderRadius: 8, 
                  borderLeftWidth: 4, 
                  borderLeftColor: bmiCategory.color,
                  marginBottom: 16
                }}>
                  <Text style={{ fontWeight: '700', color: bmiCategory.color }}>
                    BMI: {bmi} — {bmiCategory.label}
                  </Text>
                </View>
              )}
              
              <RenderInput label={t('muac') + ' (cm)'} value={tracker.muac} onChange={(t) => setTracker({...tracker, muac: t})} placeholder="e.g. 12.5" keyboardType="numeric" />
              
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t('hasDiarrhea', 'Has Diarrhea?')}</Text>
                <Switch value={tracker.hasDiarrhea} onValueChange={(v) => setTracker({...tracker, hasDiarrhea: v})} trackColor={{ true: COLORS.primary, false: '#D1DBCE' }} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('childDevelopmentMilestones', 'Development & Vitamin A / Deworming')}</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('childMilestones', 'Child Milestones')}</Text>
                <View style={styles.pickerContainer}>
                  {['None', 'Neck Support', 'Rolling Over', 'Crawling', 'Sitting', 'Standing'].map((ms) => (
                    <TouchableOpacity
                      key={ms}
                      style={[styles.chip, tracker.childMilestones === ms && styles.chipActive]}
                      onPress={() => setTracker({ ...tracker, childMilestones: ms })}
                    >
                      <Text style={[styles.chipText, tracker.childMilestones === ms && styles.chipTextActive]}>{t(ms, ms)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t('exclusiveBreastfeeding', 'Exclusive Breastfeeding (up to 6m)?')}</Text>
                <Switch value={tracker.exclusiveBreastfeeding} onValueChange={(v) => setTracker({...tracker, exclusiveBreastfeeding: v})} trackColor={{ true: COLORS.primary, false: '#D1DBCE' }} />
              </View>

              <View style={styles.divider} />
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vitaminADose', 'Vitamin A Dose Course')}</Text>
                <View style={styles.pickerContainer}>
                  {['None', 'Dose 1', 'Dose 2', 'Dose 3', 'Dose 4', 'Dose 5', 'Dose 6', 'Dose 7', 'Dose 8', 'Dose 9'].map((dose) => (
                    <TouchableOpacity
                      key={dose}
                      style={[styles.chip, tracker.vitaminADose === dose && styles.chipActive]}
                      onPress={() => setTracker({ ...tracker, vitaminADose: dose })}
                    >
                      <Text style={[styles.chipText, tracker.vitaminADose === dose && styles.chipTextActive]}>{t(dose, dose)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t('dewormingDone', 'Albendazole (Deworming) Given?')}</Text>
                <Switch value={tracker.dewormingDone} onValueChange={(v) => setTracker({...tracker, dewormingDone: v})} trackColor={{ true: COLORS.primary, false: '#D1DBCE' }} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('visitSchedule')}</Text>
              {hbncSchedule.length > 0 ? (
                hbncSchedule.map((visit, i) => (
                  <View key={i} style={styles.visitRow}>
                    <Text style={styles.visitLabel}>{visit.label}</Text>
                    <Text style={styles.visitDate}>
                      {!isNaN(new Date(visit.date).getTime()) ? new Date(visit.date).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>{t('noHbncSchedule', 'No HBNC schedule found.')}</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('immunizationSchedule')}</Text>
              {vaccinationSchedule.length > 0 ? (
                vaccinationSchedule.map((vax, i) => (
                  <View key={i} style={styles.visitRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.visitLabel}>{vax.label}</Text>
                      <Text style={styles.vaccineList}>{vax.vaccines}</Text>
                    </View>
                    <Text style={styles.visitDate}>
                      {!isNaN(new Date(vax.date).getTime()) ? new Date(vax.date).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>{t('noImmunizationSchedule', 'No immunization schedule found.')}</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('aefiTracking', 'AEFI (Adverse Events)')}</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t('hasAefi', 'Reported AEFI post-vaccination?')}</Text>
                <Switch value={tracker.hasAefi} onValueChange={(v) => setTracker({...tracker, hasAefi: v})} trackColor={{ true: COLORS.primary, false: '#D1DBCE' }} />
              </View>
              {tracker.hasAefi && (
                 <RenderInput label={t('aefiDetails', 'AEFI Details (e.g. High fever, swelling)')} value={tracker.aefiDetails} onChange={(t) => setTracker({...tracker, aefiDetails: t})} placeholder={t('describeSymptoms', 'Describe symptoms')} />
              )}
            </View>
          </>
        )}

        {activeTab === 'NCD' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('ncdScreening')}</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, minWidth: 120 }]}>
                <Text style={styles.label}>{t('bpSystolic', 'BP Systolic')}</Text>
                <TextInput style={styles.input} value={tracker.bpSystolic}
                  onChangeText={(t) => setTracker({ ...tracker, bpSystolic: t })}
                  placeholder="120" keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1, minWidth: 120 }]}>
                <Text style={styles.label}>{t('bpDiastolic', 'BP Diastolic')}</Text>
                <TextInput style={styles.input} value={tracker.bpDiastolic}
                  onChangeText={(t) => setTracker({ ...tracker, bpDiastolic: t })}
                  placeholder="80" keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, minWidth: 120 }]}>
                <Text style={styles.label}>{t('bloodSugar', 'Blood Sugar (mg/dL)')}</Text>
                <TextInput style={styles.input} value={tracker.sugarLevel}
                  onChangeText={(t) => setTracker({ ...tracker, sugarLevel: t })}
                  placeholder="90" keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1, minWidth: 120 }]}>
                <Text style={styles.label}>{t('heartRate', 'Heart Rate (bpm)')}</Text>
                <TextInput style={styles.input} value={tracker.heartRate}
                  onChangeText={(t) => setTracker({ ...tracker, heartRate: t })}
                  placeholder="72" keyboardType="numeric" />
              </View>
            </View>

            <RenderInput label={t('hbLevel')} value={tracker.hbLevel} onChange={(t) => setTracker({...tracker, hbLevel: t})} placeholder="12.0" keyboardType="numeric" />
            <RenderInput label={t('weight')} value={tracker.weight} onChange={(t) => setTracker({...tracker, weight: t})} placeholder="60" keyboardType="numeric" />
            
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('cancerScreening', 'Cancer Screening')}</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, minWidth: 100 }]}>
                <Text style={styles.label}>{t('cancerOral', 'Oral Cancer')}</Text>
                <View style={styles.pickerContainer}>
                  {['normal', 'abnormal', 'referred'].map((opt) => (
                    <TouchableOpacity key={opt} style={[styles.chip, tracker.cancerOral === opt && styles.chipActive]} onPress={() => setTracker({ ...tracker, cancerOral: opt })}>
                      <Text style={[styles.chipText, tracker.cancerOral === opt && styles.chipTextActive]}>{t(opt)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {member.gender === 'Female' && (
                <>
                  <View style={[styles.inputGroup, { flex: 1, minWidth: 100 }]}>
                    <Text style={styles.label}>{t('cancerBreast', 'Breast Cancer')}</Text>
                    <View style={styles.pickerContainer}>
                      {['normal', 'abnormal', 'referred'].map((opt) => (
                        <TouchableOpacity key={opt} style={[styles.chip, tracker.cancerBreast === opt && styles.chipActive]} onPress={() => setTracker({ ...tracker, cancerBreast: opt })}>
                          <Text style={[styles.chipText, tracker.cancerBreast === opt && styles.chipTextActive]}>{t(opt)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, minWidth: 100 }]}>
                    <Text style={styles.label}>{t('cancerCervical', 'Cervical Cancer (VIA)')}</Text>
                    <View style={styles.pickerContainer}>
                      {['normal', 'abnormal', 'referred'].map((opt) => (
                        <TouchableOpacity key={opt} style={[styles.chip, tracker.cancerCervical === opt && styles.chipActive]} onPress={() => setTracker({ ...tracker, cancerCervical: opt })}>
                          <Text style={[styles.chipText, tracker.cancerCervical === opt && styles.chipTextActive]}>{t(opt)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>

            <View style={styles.divider} />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('cbacScore', 'CBAC Risk Score (0-10+)')}</Text>
              <TextInput style={styles.input} value={tracker.cbacScore} onChangeText={(t) => setTracker({ ...tracker, cbacScore: t })} placeholder="Score >4 needs screening" keyboardType="numeric" />
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('substanceUse')}</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('usesTobacco')}</Text>
              <Switch value={tracker.usesTobacco} onValueChange={(v) => setTracker({...tracker, usesTobacco: v})} trackColor={{ true: COLORS.primary, false: '#D1DBCE' }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('consumesAlcohol')}</Text>
              <Switch value={tracker.usesAlcohol} onValueChange={(v) => setTracker({...tracker, usesAlcohol: v})} trackColor={{ true: COLORS.primary, false: '#D1DBCE' }} />
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('tbScreening', 'TB Screening')}</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('coughTwoWeeks', 'Cough > 2 Weeks')}</Text>
              <Switch value={tracker.tbScreening.hasCoughTwoWeeks} onValueChange={(v) => setTracker({...tracker, tbScreening: {...tracker.tbScreening, hasCoughTwoWeeks: v}})} trackColor={{ true: COLORS.primary, false: '#D1DBCE' }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('fever', 'Fever')}</Text>
              <Switch value={tracker.tbScreening.hasFever} onValueChange={(v) => setTracker({...tracker, tbScreening: {...tracker.tbScreening, hasFever: v}})} trackColor={{ true: COLORS.primary, false: '#D1DBCE' }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('weightLoss', 'Weight Loss')}</Text>
              <Switch value={tracker.tbScreening.hasWeightLoss} onValueChange={(v) => setTracker({...tracker, tbScreening: {...tracker.tbScreening, hasWeightLoss: v}})} trackColor={{ true: COLORS.primary, false: '#D1DBCE' }} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('tbLabResult', 'TB Lab Result (Sputum/CBNAAT)')}</Text>
              <View style={styles.pickerContainer}>
                {['not_screened', 'negative', 'positive'].map((opt) => (
                  <TouchableOpacity key={opt} style={[styles.chip, tracker.tbLabResult === opt && styles.chipActive]} onPress={() => setTracker({ ...tracker, tbLabResult: opt })}>
                    <Text style={[styles.chipText, tracker.tbLabResult === opt && styles.chipTextActive]}>{t(opt.replace('_', ''))}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('malariaScreening', 'Malaria Screening')}</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('feverWithChills', 'Fever with Chills')}</Text>
              <Switch value={tracker.hasFeverWithChills} onValueChange={(v) => setTracker({...tracker, hasFeverWithChills: v})} trackColor={{ true: COLORS.primary, false: '#D1DBCE' }} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('malariaLabResult', 'Malaria Lab Result (RDT/Microscopy)')}</Text>
              <View style={styles.pickerContainer}>
                {['not_screened', 'negative', 'positive_pf', 'positive_pv'].map((opt) => (
                  <TouchableOpacity key={opt} style={[styles.chip, tracker.malariaLabResult === opt && styles.chipActive]} onPress={() => setTracker({ ...tracker, malariaLabResult: opt })}>
                    <Text style={[styles.chipText, tracker.malariaLabResult === opt && styles.chipTextActive]}>{t(opt.replace('_', ''))}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('leprosyTbDots', 'Leprosy & TB DOTS')}</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('hasSkinPatches', 'Skin Patches (Loss of Sensation)')}</Text>
              <Switch value={tracker.hasSkinPatches} onValueChange={(v) => setTracker({...tracker, hasSkinPatches: v})} trackColor={{ true: COLORS.primary, false: '#D1DBCE' }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('onTbTreatment', 'On TB Treatment (DOTS)')}</Text>
              <Switch value={tracker.onTbTreatment} onValueChange={(v) => setTracker({...tracker, onTbTreatment: v})} trackColor={{ true: COLORS.primary, false: '#D1DBCE' }} />
            </View>
          </View>
        )}

        {activeTab === 'FP' && isEC && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('familyPlanning')}</Text>
            <Text style={styles.label}>{t('fpMethod')}</Text>
            <View style={styles.pickerContainer}>
              {fpMethods.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.chip, tracker.fpMethod === m.value && styles.chipActive]}
                  onPress={() => setTracker({ ...tracker, fpMethod: m.value })}
                >
                  <Text style={[styles.chipText, tracker.fpMethod === m.value && styles.chipTextActive]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.divider} />
            <Text style={styles.label}>{t('fpContraceptiveHistory', 'Parity / Previous Children')}</Text>
            <View style={styles.pickerContainer}>
              {['0', '1', '2', '3+'].map((opt) => (
                <TouchableOpacity key={opt} style={[styles.chip, tracker.fpContraceptiveHistory === opt && styles.chipActive]} onPress={() => setTracker({ ...tracker, fpContraceptiveHistory: opt })}>
                  <Text style={[styles.chipText, tracker.fpContraceptiveHistory === opt && styles.chipTextActive]}>{t(opt, opt)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {tracker.fpMethod === 'injectable' && (
              <>
                <View style={styles.divider} />
                <Text style={styles.label}>{t('nextInjectableDate', 'Next Injectable Date (Antara)')}</Text>
                <TextInput style={styles.input} value={tracker.nextInjectableDate} onChangeText={(t) => setTracker({ ...tracker, nextInjectableDate: t })} placeholder="YYYY-MM-DD" />
              </>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{t('saveRecords', 'Save Records')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Downgrade Justification Modal */}
      <Modal visible={showDowngradeModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: COLORS.error }]}>⚠️ {t('governanceAlert', 'Governance Alert')}</Text>
            <Text style={styles.modalText}>{t('governanceAlertDesc', 'You are marking a High-Risk case as NORMAL. Please enter clinical justification:')}</Text>
            
            <TextInput 
              style={[styles.input, { height: 80, textAlignVertical: 'top', marginTop: 12 }]} 
              multiline
              numberOfLines={3}
              placeholder={t('enterJustification', 'Clinical reasoning...')}
              value={downgradeReason} 
              onChangeText={setDowngradeReason} 
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowDowngradeModal(false)}>
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleConfirmDowngrade}>
                <Text style={styles.modalSaveText}>{t('confirm', 'Confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, backgroundColor: COLORS.surface, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 10, marginRight: 10 },
  backBtnText: { fontSize: 24, color: COLORS.primary, fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  headerSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  tabBarContainer: { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBarScroll: { flexDirection: 'row', padding: 8, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', borderRadius: 8, minWidth: 100 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: '#FFF' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  required: { color: COLORS.error },
  input: { height: 48, backgroundColor: '#FAFAFA', borderRadius: 8, paddingHorizontal: 12, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  riskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: COLORS.border, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  riskLabel: { fontSize: 13, color: COLORS.text, flex: 1 },
  visitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  visitLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  visitDate: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  vaccineList: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontStyle: 'italic' },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', padding: 20 },
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 12, minHeight: 44, borderRadius: 22,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary },
  chipTextActive: { color: '#FFF', fontWeight: '600' },
  checkboxLabel: { fontSize: 16, color: COLORS.text, flex: 1 },
  saveBtn: {
    backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 40,
  },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, color: COLORS.text },
  modalText: { fontSize: 14, color: COLORS.textSecondary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '700' },
  modalSaveBtn: { backgroundColor: COLORS.error, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  modalSaveText: { color: '#FFF', fontWeight: '700' },
});

export default HealthTrackerScreen;
