import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { generateGoshwaraReport } from '../utils/goshwaraLogic';
import { exportMasterPopulation, exportVitalEvents, exportFPRegister, exportVHNDSessions, exportPHCMonthlyWorkbook, exportFamilySurveyReport } from '../utils/exportLogic';

import { useTranslation } from 'react-i18next';

const GoshwaraReportScreen = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [drillDownList, setDrillDownList] = useState(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthName = new Date().toLocaleString('default', { month: 'long' });

  useEffect(() => {
    loadGoshwara();
  }, []);

  const loadGoshwara = async () => {
    setLoading(true);
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    const allEvents = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
    const allVitalEvents = await storage.getAll(STORAGE_KEYS.VITAL_EVENTS);
    const allVhndSessions = await storage.getAll(STORAGE_KEYS.VHND_SESSIONS);
    
    // Hierarchy filtering
    let members = allMembers;
    let events = allEvents;
    let vitalEvents = allVitalEvents;
    let vhndSessions = allVhndSessions;
    if (user?.role === 'ASHA') {
      const assigned = user.assignedVillages || [];
      const assignedIds = new Set(assigned.map(v => {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object') return v.id || v.villageId;
        return null;
      }).filter(Boolean));
      if (user.villageId) assignedIds.add(user.villageId);

      members = allMembers.filter(m => m.ashaId === user.id || assignedIds.has(m.villageId));
      events = allEvents.filter(e => e.payload?.ashaId === user.id);
      vitalEvents = allVitalEvents.filter(e => e.ashaId === user.id || assignedIds.has(e.villageId));
      vhndSessions = allVhndSessions.filter(s => s.ashaId === user.id || assignedIds.has(s.villageId));
    } else if (user?.role === 'ANM') {
      members = allMembers.filter(m => m.subCenterId === user.subCenterId);
      events = allEvents.filter(e => e.payload?.subCenterId === user.subCenterId);
      vitalEvents = allVitalEvents.filter(e => e.subCenterId === user.subCenterId);
      vhndSessions = allVhndSessions.filter(s => s.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      members = allMembers.filter(m => m.phcId === user.phcId);
      events = allEvents.filter(e => e.payload?.phcId === user.phcId);
      vitalEvents = allVitalEvents.filter(e => e.phcId === user.phcId);
      vhndSessions = allVhndSessions.filter(s => s.phcId === user.phcId);
    }

    const report = generateGoshwaraReport(members, vitalEvents, vhndSessions, events, currentMonth, currentYear);
    setData(report);
    setLoading(false);
  };

  const handleDrillDown = (key, label) => {
    const list = data.drillDown[key];
    if (list && list.length > 0) {
      setDrillDownList({ label, list });
    } else {
      Alert.alert(t('noRecords', 'No Records'), t('noRecordsDetails', 'There are no line-listing records for ') + label);
    }
  };

  const handleFinalize = async () => {
    const monthYear = `${currentMonth}-${currentYear}`;
    await storage.save(STORAGE_KEYS.LOCKED_PERIODS, { id: monthYear, finalizedAt: new Date().toISOString() });
    Alert.alert(t('reportFrozen', 'Report Frozen'), t('reportFrozenDetails', 'The Goshwara for ') + `${monthName} ${currentYear}` + t('reportFrozenDetailsSuffix', ' has been locked. No further changes can be made for this period.'));
    onBack();
  };

  // ===== EXPORT: Monthly Report (PHC Workbook) =====
  const handleExportGoshwara = async () => {
    setExporting('GOSHWARA');
    try {
      const success = await exportPHCMonthlyWorkbook(user, data);
      if (success) {
        Alert.alert(t('success'), t('goshwaraSuccess'));
      } else {
        Alert.alert(t('error'), t('exportFailed'));
      }
    } catch (e) {
      console.error('Monthly Report Export Error:', e);
      Alert.alert(t('error'), t('exportFailed') + ': ' + e.message);
    }
    setExporting(null);
  };

  // ===== EXPORT: Family Survey Goshwara =====
  const handleExportFamilySurvey = async () => {
    setExporting('FAMILY_SURVEY');
    try {
      const success = await exportFamilySurveyReport(user);
      if (success) {
        Alert.alert(t('success'), t('familySurveySuccess', 'Family Survey Goshwara downloaded successfully.'));
      } else {
        Alert.alert(t('error'), t('exportFailed'));
      }
    } catch (e) {
      Alert.alert(t('error'), e.message);
    }
    setExporting(null);
  };

  // ===== Individual report downloads =====
  const handleSectionDownload = async (type) => {
    setExporting(type);
    try {
      let success = false;
      switch (type) {
        case 'VITAL_BIRTHS': 
        case 'BIRTHS': success = await exportVitalEvents(user, 'Birth'); break;
        case 'VITAL_DEATHS':
        case 'DEATHS': success = await exportVitalEvents(user, 'Death'); break;
        case 'VHND_SESSIONS':
        case 'VHND': success = await exportVHNDSessions(user); break;
        case 'FP_REGISTER':
        case 'FP': success = await exportFPRegister(user); break;
        case 'HRP': success = await exportMasterPopulation(user, 'HIGH_RISK_ANC'); break;
        case 'ANEMIA': success = await exportMasterPopulation(user, 'SEVERE_ANEMIA'); break;
        case 'SAM': success = await exportMasterPopulation(user, 'SAM_CHILDREN'); break;
        default: success = await exportMasterPopulation(user, type);
      }
      if (success) Alert.alert(t('success'), t('excelSuccess'));
      else Alert.alert(t('error'), t('exportFailed'));
    } catch (e) { Alert.alert(t('error'), e.message); }
    setExporting(null);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const DownloadBtn = ({ type, label }) => (
    <TouchableOpacity
      style={styles.sectionDownloadBtn}
      onPress={() => handleSectionDownload(type)}
      disabled={exporting !== null}
    >
      {exporting === type ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <Text style={styles.sectionDownloadText}>📥 {label || 'Excel'}</Text>
      )}
    </TouchableOpacity>
  );

  const RenderSection = ({ title, items, downloadType, downloadLabel }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>{title}</Text>
        {downloadType && <DownloadBtn type={downloadType} label={downloadLabel} />}
      </View>
      <View style={styles.grid}>
        {items.map((item, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={styles.statBox}
            onPress={() => item.drillKey ? handleDrillDown(item.drillKey, item.label) : null}
            disabled={!item.drillKey}
          >
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
            {item.drillKey && <Text style={styles.drillHint}>View List</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const RenderTable = ({ title, rows }) => (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.cell, { flex: 2 }]}>Age Group</Text>
        <Text style={styles.cell}>Male</Text>
        <Text style={styles.cell}>Female</Text>
        <Text style={styles.cell}>Total</Text>
      </View>
      {rows.map((row, idx) => (
        <View key={idx} style={styles.tableRow}>
          <Text style={[styles.cell, { flex: 2, fontWeight: '700' }]}>{row.label}</Text>
          <Text style={styles.cell}>{row.m}</Text>
          <Text style={styles.cell}>{row.f}</Text>
          <Text style={[styles.cell, { fontWeight: '800' }]}>{row.m + row.f}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('goshwaraAbstract', 'Goshwara Abstract')}</Text>
          <Text style={styles.headerSubtitle}>{t('scMonthlySummary', 'Sub-Centre Monthly Summary')} • {monthName} {currentYear}</Text>
        </View>
        <TouchableOpacity 
          style={styles.masterExportBtn} 
          onPress={handleExportGoshwara}
          disabled={exporting !== null}
        >
          {exporting === 'GOSHWARA' ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.masterExportText}>📊 Excel</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Full Goshwara Download */}
        <TouchableOpacity 
          style={styles.fullExportBtn}
          onPress={handleExportGoshwara}
          disabled={exporting !== null}
        >
          {exporting === 'GOSHWARA' ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.fullExportText}>📥 {t('downloadMonthlyReport', 'Download Monthly Report (Excel)')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.fullExportBtn, { backgroundColor: '#0F766E' }]}
          onPress={handleExportFamilySurvey}
          disabled={exporting !== null}
        >
          {exporting === 'FAMILY_SURVEY' ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.fullExportText}>📋 {t('downloadFamilySurvey', 'Download Family Survey Goshwara')}</Text>
          )}
        </TouchableOpacity>

        <RenderTable 
          title={t('popAbstract', 'Population Abstract (Demographics)')}
          rows={[
            { label: t('0_12m', '0-12 Months'), ...data.stats.demographics.age_0_12m },
            { label: t('13_24m', '13-24 Months'), ...data.stats.demographics.age_13_24m },
            { label: t('5_6y', '5-6 Years'), ...data.stats.demographics.age_5_6y },
            { label: t('10_11y', '10-11 Years'), ...data.stats.demographics.age_10_11y },
            { label: t('16_17y', '16-17 Years'), ...data.stats.demographics.age_16_17y },
            { label: t('17_19y', '17-19 Years'), ...data.stats.demographics.age_17_19y },
            { label: t('40_60y', '40-60 Years'), ...data.stats.demographics.age_40_60y },
            { label: t('60plus', '60+ Years'), ...data.stats.demographics.age_60plus },
          ]}
        />

        <RenderSection 
          title={t('maternalHealthAbstract', '1. Maternal Health Abstract')}
          downloadType="HRP" downloadLabel={t('hrpList', 'HRP List')}
          items={[
            { label: t('newAnc'), value: data.stats.maternal.mh01_newANC },
            { label: t('earlyReg'), value: data.stats.maternal.mh02_earlyANC },
            { label: t('highRisk'), value: data.stats.maternal.mh05_hrpIdentified, drillKey: 'mh05_hrpIdentified' },
            { label: t('severeAnemia'), value: data.stats.maternal.mh06_severeAnemia, drillKey: 'mh06_severeAnemia' },
            { label: t('tdDosesGiven'), value: data.stats.maternal.mh03_tdDoses || 0 },
            { label: t('anc4Completed'), value: data.stats.maternal.mh04_anc4 || 0 },
            { label: t('ifa180Given'), value: data.stats.maternal.mh07_ifa180 || 0 },
          ]}
        />

        <RenderSection 
          title={t('deliveryAbstract', '2. Delivery Abstract')}
          downloadType="BIRTHS" downloadLabel={t('birthRegister')}
          items={[
            { label: t('instPublic'), value: data.stats.delivery.dl01_instPublic },
            { label: t('instPrivate'), value: data.stats.delivery.dl02_instPrivate },
            { label: t('liveBirths'), value: data.stats.delivery.dl05_liveBirthM + data.stats.delivery.dl06_liveBirthF },
            { label: t('stillBirths'), value: data.stats.delivery.dl07_stillBirths },
            { label: t('homeSkilled'), value: data.stats.delivery.dl03_homeSkilled || 0 },
            { label: t('homeUnskilled'), value: data.stats.delivery.dl04_homeUnskilled || 0 },
            { label: t('pnc48hr'), value: data.stats.delivery.dl09_pnc48hr || 0 },
          ]}
        />

        <RenderSection 
          title={t('childHealthVitalAbstract', '3. Child Health & Vital')}
          downloadType="SAM" downloadLabel={t('samList', 'SAM List')}
          items={[
            { label: t('lbwBabies'), value: data.stats.child.ch02_lbw },
            { label: t('fullyImm'), value: data.stats.child.ch07_fullyImm_M + data.stats.child.ch08_fullyImm_F },
            { label: t('samReferral'), value: data.stats.child.ch11_samReferral, drillKey: 'ch11_samReferral' },
            { label: t('matDeaths'), value: data.stats.vital.vs04_maternalDeath, drillKey: 'vs04_maternalDeath' },
            { label: t('newbornsWeighed'), value: data.stats.child.ch01_weighed || 0 },
            { label: t('bfInitiated'), value: data.stats.child.ch03_bfInitiated || 0 },
            { label: t('bcgGiven'), value: data.stats.child.ch04_bcg || 0 },
            { label: t('penta3Given'), value: data.stats.child.ch05_penta3 || 0 },
            { label: t('mr1Given'), value: data.stats.child.ch06_mr1 || 0 },
            { label: t('neonatalDeaths'), value: data.stats.vital.vs01_neonatalDeath || 0 },
            { label: t('infantDeaths'), value: data.stats.vital.vs02_infantDeath || 0 },
            { label: t('childDeaths'), value: data.stats.vital.vs03_childDeath || 0 },
            { label: t('adultDeaths'), value: data.stats.vital.vs05_adultDeath || 0 },
          ]}
        />

        <RenderSection 
          title={t('familyPlanningAbstract', '4. Family Planning')}
          downloadType="FP" downloadLabel={t('fpRegister')}
          items={[
            { label: t('tubectomy'), value: data.stats.fp.fp01_tubectomy },
            { label: t('vasectomy'), value: data.stats.fp.fp02_vasectomy },
            { label: t('iucd'), value: data.stats.fp.fp03_iucd },
            { label: t('ocp'), value: data.stats.fp.fp05_ocp },
            { label: t('condoms'), value: data.stats.fp.fp06_condoms },
          ]}
        />

        <View style={styles.downloadGrid}>
          <DownloadBtn type="MASTER" label="Master Population" />
          <DownloadBtn type="NEW_ANC" label="All ANC Register" />
          <DownloadBtn type="PENDING_ANC" label="Pending ANC Register" />
          <DownloadBtn type="HRP" label="High Risk ANC" />
          <DownloadBtn type="ANEMIA" label="Severe Anemia" />
          <DownloadBtn type="SAM" label="SAM Children" />
          <DownloadBtn type="FULLY_IMMUNIZED" label="Fully Immunized" />
          <DownloadBtn type="NCD_SCREENING" label="NCD Screenings" />
          <DownloadBtn type="PNC_CASES" label="PNC Register" />
          <DownloadBtn type="VITAL_BIRTHS" label="Birth Register" />
          <DownloadBtn type="VITAL_DEATHS" label="Death Register" />
          <DownloadBtn type="VHND_SESSIONS" label="VHND Sessions" />
          <DownloadBtn type="FP_REGISTER" label="FP Register" />
          <DownloadBtn type="FP_PERMANENT" label="FP Permanent Method" />
          <DownloadBtn type="FP_SPACING" label="FP Spacing Method" />
          <DownloadBtn type="FP_NONE" label="No FP Method" />
          <DownloadBtn type="TB_SUSPECTS" label="TB Suspects" />
          <DownloadBtn type="MALARIA_SUSPECTS" label="Malaria Suspects" />
          <DownloadBtn type="LEPROSY_SUSPECTS" label="Leprosy Suspects" />
          <DownloadBtn type="PWD" label="PwD List" />
          <DownloadBtn type="BPL_FAMILIES" label="BPL Families" />
        </View>

        <TouchableOpacity style={styles.finalizeButton} onPress={handleFinalize}>
          <Text style={styles.finalizeButtonText}>{t('finalizeAndSubmit', 'Finalize & Submit Report')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{t('backToDashboard', 'Back to Dashboard')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {drillDownList && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{drillDownList.label}</Text>
            <ScrollView style={styles.modalList}>
              {drillDownList.list.map((m, idx) => (
                <View key={idx} style={styles.drillItem}>
                  <Text style={styles.drillName}>{m.firstName || m.motherName} {m.lastName || ''}</Text>
                  <Text style={styles.drillDetails}>House No: {m.houseNo || 'N/A'} • {m.phone || 'No Mobile'}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setDrillDownList(null)}>
              <Text style={styles.closeButtonText}>{t('closeList', 'Close List')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { padding: 24, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 10, marginRight: 10 },
  backBtnText: { fontSize: 24, color: '#FFF', fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' },
  masterExportBtn: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  masterExportText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  scrollContent: { padding: 16 },
  fullExportBtn: { backgroundColor: COLORS.secondary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20, elevation: 3 },
  fullExportText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  section: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  sectionDownloadBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  sectionDownloadText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  tableHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: '#F1F5F9', marginBottom: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  cell: { flex: 1, fontSize: 12, color: '#475569', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: { width: '48%', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  statValue: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', marginTop: 4 },
  drillHint: { fontSize: 9, color: COLORS.primary, fontWeight: '700', marginTop: 6, textDecorationLine: 'underline' },
  downloadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  finalizeButton: { height: 56, backgroundColor: COLORS.success, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  finalizeButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  backButton: { height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 40 },
  backButtonText: { color: COLORS.textSecondary, fontWeight: '600' },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 20 },
  modalList: { marginBottom: 20 },
  drillItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  drillName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  drillDetails: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  closeButton: { height: 50, backgroundColor: '#F1F5F9', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { color: '#475569', fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default GoshwaraReportScreen;
