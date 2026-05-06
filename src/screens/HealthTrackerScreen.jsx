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
} from 'react-native';
import { COLORS } from '../constants/colors';
import { calculateChildSchedule, shouldShowMaternalFields, ANC_RISK_FACTORS, calculateVaccinationSchedule } from '../utils/healthLogic';
import { storage, STORAGE_KEYS } from '../database/storage';
import { useTranslation } from 'react-i18next';

const RenderInput = ({ label, value, onChange, placeholder, keyboardType = 'default' }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={placeholder} keyboardType={keyboardType} />
  </View>
);

const HealthTrackerScreen = ({ member, onSave, onBack }) => {
  const { t } = useTranslation();
  const [tracker, setTracker] = useState({
    ancStatus: member?.healthData?.ancStatus || 'none',
    edd: member?.healthData?.edd || '',
    isHighRisk: member?.healthData?.isHighRisk || false,
    selectedRiskFactors: member?.healthData?.selectedRiskFactors || [],
    bpSystolic: member?.healthData?.bpSystolic || '',
    bpDiastolic: member?.healthData?.bpDiastolic || '',
    hbLevel: member?.healthData?.hbLevel || '',
    sugarLevel: member?.healthData?.sugarLevel || '',
    weight: member?.healthData?.weight || '',
    vaccinationStatus: member?.healthData?.vaccinationStatus || 'Incomplete',
    fpMethod: member?.healthData?.fpMethod || 'none',
    usesTobacco: member?.healthData?.usesTobacco || false,
    usesAlcohol: member?.healthData?.usesAlcohol || false,
    lmp: member?.healthData?.lmp || '',
  });

  const hbncSchedule = member?.dob ? calculateChildSchedule(member.dob).hbnc : [];
  const vaccinationSchedule = member?.dob ? calculateVaccinationSchedule(member.dob) : [];
  const memberAge = parseInt(member?.age) || 0;
  const showMaternal = member ? shouldShowMaternalFields(member.gender, memberAge) : true;
  const isEC = member?.gender === 'Female' && memberAge >= 15 && memberAge <= 49 && !member?.healthData?.isPregnant;
  const isChild = memberAge < 17;

  const tabs = [];
  if (showMaternal) tabs.push('ANC');
  if (isChild) tabs.push('CHILD');
  if (!isChild) tabs.push('NCD');
  if (isEC) tabs.push('FP');

  const [activeTab, setActiveTab] = useState(tabs[0] || 'NCD');

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
    return alerts;
  };

  const persistData = async () => {
    const isRedFlag = (parseInt(tracker.bpSystolic) > 140 || parseInt(tracker.bpDiastolic) > 90) || 
                      (parseFloat(tracker.hbLevel) > 0 && parseFloat(tracker.hbLevel) < 7) || 
                      (memberAge <= 5 && parseFloat(tracker.weight) > 0 && parseFloat(tracker.weight) < 10);
    const finalIsHighRisk = tracker.selectedRiskFactors.length > 0 || isRedFlag;

    const updatedMember = {
      ...member,
      healthData: { ...member?.healthData, ...tracker, isHighRisk: finalIsHighRisk },
    };
    await storage.save(STORAGE_KEYS.MEMBERS, updatedMember);
    if (Platform.OS === 'web') {
      window.alert(t('success'));
    } else {
      Alert.alert(t('success'), t('healthTracker') + ' ' + t('success'));
    }
    // Only call onSave (which handles navigation back). Don't call onBack too.
    if (onSave) onSave(updatedMember);
    else if (onBack) onBack();
  };

  const isPeriodLocked = async () => {
    try {
      const locked = await storage.getRaw(STORAGE_KEYS.LOCKED_PERIODS) || [];
      const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      return locked.includes(currentMonth);
    } catch (e) {
      return false;
    }
  };

  const handleSave = async () => {
    const locked = await isPeriodLocked();
    if (locked && user?.role !== 'Admin') {
      Alert.alert(t('reportingLocked'), t('reportingLockedDesc'));
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

      <View style={styles.tabBar}>
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
                      const lmpDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                      if (!isNaN(lmpDate.getTime())) {
                        lmpDate.setDate(lmpDate.getDate() + 280);
                        newEdd = lmpDate.toISOString().split('T')[0];
                      }
                    }
                  }
                  setTracker({ ...tracker, lmp: cleaned, edd: newEdd });
                }}
                placeholder="DD/MM/YYYY" keyboardType="numeric" maxLength={10} />
            </View>
            
            {tracker.edd ? (
              <Text style={{ fontSize: 13, color: COLORS.primary, marginBottom: 16, fontWeight: '600' }}>
                {t('autoEdd')}: {tracker.edd}
              </Text>
            ) : null}

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>{t('bpSystolic', 'BP Systolic')} <Text style={styles.required}>*</Text></Text>
                <TextInput style={styles.input} value={tracker.bpSystolic}
                  onChangeText={(t) => setTracker({ ...tracker, bpSystolic: t })}
                  placeholder="120" keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>{t('bpDiastolic', 'BP Diastolic')}</Text>
                <TextInput style={styles.input} value={tracker.bpDiastolic}
                  onChangeText={(t) => setTracker({ ...tracker, bpDiastolic: t })}
                  placeholder="80" keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>{t('hbLevel')}</Text>
                <TextInput style={styles.input} value={tracker.hbLevel}
                  onChangeText={(t) => setTracker({ ...tracker, hbLevel: t })}
                  placeholder="11.0" keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>{t('weight')}</Text>
                <TextInput style={styles.input} value={tracker.weight}
                  onChangeText={(t) => setTracker({ ...tracker, weight: t })}
                  placeholder="55" keyboardType="numeric" />
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
            <Text style={styles.emptyText}>ANC tracking is available for females aged 15-49.</Text>
          </View>
        )}

        {activeTab === 'CHILD' && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('growthMonitoring')}</Text>
              <RenderInput label={t('weight')} value={tracker.weight} onChange={(t) => setTracker({...tracker, weight: t})} placeholder="e.g. 10.5" keyboardType="numeric" />
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
                <Text style={styles.emptyText}>No HBNC schedule found.</Text>
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
                <Text style={styles.emptyText}>No immunization schedule found.</Text>
              )}
            </View>
          </>
        )}

        {activeTab === 'NCD' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('ncdScreening')}</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>{t('bpSystolic', 'BP Systolic')}</Text>
                <TextInput style={styles.input} value={tracker.bpSystolic}
                  onChangeText={(t) => setTracker({ ...tracker, bpSystolic: t })}
                  placeholder="120" keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>{t('bpDiastolic', 'BP Diastolic')}</Text>
                <TextInput style={styles.input} value={tracker.bpDiastolic}
                  onChangeText={(t) => setTracker({ ...tracker, bpDiastolic: t })}
                  placeholder="80" keyboardType="numeric" />
              </View>
            </View>

            <RenderInput label={t('hbLevel')} value={tracker.hbLevel} onChange={(t) => setTracker({...tracker, hbLevel: t})} placeholder="12.0" keyboardType="numeric" />
            <RenderInput label={t('weight')} value={tracker.weight} onChange={(t) => setTracker({...tracker, weight: t})} placeholder="60" keyboardType="numeric" />
            
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
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('saveContinue')}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
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
  row: { flexDirection: 'row' },
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
  saveButton: { height: 52, backgroundColor: COLORS.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFF' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textSecondary },
  chipTextActive: { color: '#FFF', fontWeight: '700' },
});

export default HealthTrackerScreen;
