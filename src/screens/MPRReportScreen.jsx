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
import { generateMPRStats } from '../utils/reportLogic';
import { 
  exportMasterPopulation, 
  exportVitalEvents, 
  exportVHNDSessions, 
  exportFPRegister, 
  exportMPRSummary 
} from '../utils/exportLogic';
import { useTranslation } from 'react-i18next';

const MPRReportScreen = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  const [ashaName, setAshaName] = useState(user?.name);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    const allEvents = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
    const allUsers = await storage.getAll(STORAGE_KEYS.USERS);
    
    // Hierarchy filtering
    let members = allMembers;
    let events = allEvents;
    let currentAshaName = user?.name;
    
    if (user?.role === 'ASHA') {
      members = allMembers.filter(m => m.ashaId === user.id || m.villageId === user.villageId);
      events = allEvents.filter(e => e.payload?.ashaId === user.id || e.payload?.villageId === user.villageId);
    } else if (user?.role === 'ANM') {
      members = allMembers.filter(m => m.subCenterId === user.subCenterId);
      events = allEvents.filter(e => e.payload?.subCenterId === user.subCenterId);
      // For ANM, we might be looking at multiple ASHAs, but if we filter by village later, we'd need that.
      // For now, if ANM is looking, use "Sub-Center Report" or similar.
    } else if (user?.role === 'MO') {
      members = allMembers.filter(m => m.phcId === user.phcId);
      events = allEvents.filter(e => e.payload?.phcId === user.phcId);
    }

    // Try to find the ASHA for the primary village in this scope if current user is not ASHA
    if (user?.role !== 'ASHA' && members.length > 0) {
      const firstMember = members[0];
      const asha = allUsers.find(u => u.id === firstMember.ashaId);
      if (asha) currentAshaName = asha.name;
    }

    const stats = generateMPRStats(members, events);
    setReport(stats);
    setAshaName(currentAshaName);
    setLoading(false);
  };

  const handleDownload = async (filterType) => {
    setExporting(filterType);
    try {
      let success = false;
      switch (filterType) {
        case 'VITAL_BIRTHS':
          success = await exportVitalEvents(user, 'Birth');
          break;
        case 'VITAL_DEATHS':
          success = await exportVitalEvents(user, 'Death');
          break;
        case 'VHND_SESSIONS':
          success = await exportVHNDSessions(user);
          break;
        case 'FP_REGISTER':
          success = await exportFPRegister(user);
          break;
        case 'MPR_SUMMARY':
          success = await exportMPRSummary(user, report);
          break;
        default:
          success = await exportMasterPopulation(user, filterType);
      }
      if (success) {
        Alert.alert(t('success'), 'Excel report downloaded successfully.');
      } else {
        Alert.alert(t('error'), 'Failed to generate report.');
      }
    } catch (e) {
      Alert.alert(t('error'), 'Export failed: ' + e.message);
    }
    setExporting(null);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('generatingMpr')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('mpr')}</Text>
          <Text style={styles.headerSubtitle}>{ashaName || t('ashaMpr')} • {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
        </View>
        <TouchableOpacity 
          style={styles.masterExportBtn} 
          onPress={() => handleDownload(null)}
          disabled={exporting !== null}
        >
          <Text style={styles.masterExportText}>📊 Master</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* MPR Summary Download */}
        <TouchableOpacity 
          style={styles.summaryExportBtn} 
          onPress={() => handleDownload('MPR_SUMMARY')}
          disabled={exporting !== null}
        >
          {exporting === 'MPR_SUMMARY' ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.summaryExportText}>📥 {t('downloadFullMpr', 'Download Full MPR Summary (Excel)')}</Text>
          )}
        </TouchableOpacity>

        <ReportSection title={t('maternalHealth')}>
          <ReportRow label={t('totalAncReg')} value={report.maternal.newANC} onDownload={() => handleDownload('NEW_ANC')} loading={exporting === 'NEW_ANC'} />
          <ReportRow label={t('highRiskPreg')} value={report.maternal.highRiskTotal} isAlert={report.maternal.highRiskTotal > 0} onDownload={() => handleDownload('HIGH_RISK_ANC')} loading={exporting === 'HIGH_RISK_ANC'} />
          <ReportRow label={t('severeAnemiaHb')} value={report.maternal.severeAnemia} isAlert={report.maternal.severeAnemia > 0} onDownload={() => handleDownload('SEVERE_ANEMIA')} loading={exporting === 'SEVERE_ANEMIA'} />
          <ReportRow label={t('hospDel')} value={report.maternal.hospitalDeliveries} />
          <ReportRow label={t('homeDel')} value={report.maternal.homeDeliveries} />
          <ReportRow label={t('pendingAncFollowup')} value={report.maternal.pendingANC} isAlert={report.maternal.pendingANC > 0} />
        </ReportSection>

        <ReportSection title={t('childHealthNutrition')}>
          <ReportRow label={t('children05yrs')} value={report.child.samChildren + report.child.mamChildren + report.child.fullyImmunized} onDownload={() => handleDownload('CHILDREN_0_5')} loading={exporting === 'CHILDREN_0_5'} />
          <ReportRow label={t('samChildren')} value={report.child.samChildren} isAlert={report.child.samChildren > 0} onDownload={() => handleDownload('SAM_CHILDREN')} loading={exporting === 'SAM_CHILDREN'} />
          <ReportRow label={t('mamChildren', 'MAM Children')} value={report.child.mamChildren} isAlert={report.child.mamChildren > 0} onDownload={() => handleDownload('MAM_CHILDREN')} loading={exporting === 'MAM_CHILDREN'} />
          <ReportRow label={t('fullyImmunized')} value={report.child.fullyImmunized} />
        </ReportSection>

        <ReportSection title={t('vitalEvents')}>
          <ReportRow label={t('totalBirths')} value={report.vital.births} onDownload={() => handleDownload('VITAL_BIRTHS')} loading={exporting === 'VITAL_BIRTHS'} />
          <ReportRow label={t('totalDeaths')} value={report.vital.deaths} onDownload={() => handleDownload('VITAL_DEATHS')} loading={exporting === 'VITAL_DEATHS'} />
          <ReportRow label={t('infantDeaths')} value={report.vital.infantDeaths} isAlert={report.vital.infantDeaths > 0} />
        </ReportSection>

        <ReportSection title={t('familyPlanning')}>
          <ReportRow label={t('eligibleCouples')} value={report.fp.totalEC} onDownload={() => handleDownload('ELIGIBLE_COUPLE')} loading={exporting === 'ELIGIBLE_COUPLE'} />
          <ReportRow label={t('permanent')} value={report.fp.sterilization} />
          <ReportRow label={t('temporary')} value={report.fp.spacing} />
          <ReportRow label={t('noMethodUnmet')} value={report.fp.none} isAlert={report.fp.none > 0} />
          <ReportRow label={t('fpRegisterDownload')} value="" onDownload={() => handleDownload('FP_REGISTER')} loading={exporting === 'FP_REGISTER'} />
        </ReportSection>

        <ReportSection title={t('stockLedger')}>
          <ReportRow label={t('ironTablets')} value={report.stock.ironDistributed} />
          <ReportRow label={t('orsPackets')} value={report.stock.orsDistributed} />
          <ReportRow label={t('condoms')} value={report.stock.condomsDistributed} />
          <ReportRow label={t('vhndSessionLog')} value="" onDownload={() => handleDownload('VHND_SESSIONS')} loading={exporting === 'VHND_SESSIONS'} />
        </ReportSection>

        <ReportSection title={t('ncdScreeningSection')}>
          <ReportRow label={t('totalNcdScreenings')} value={report.ncd.screened} onDownload={() => handleDownload('NCD_SCREENING')} loading={exporting === 'NCD_SCREENING'} />
        </ReportSection>

        <ReportSection title={t('diseaseSurveillance', 'Disease Surveillance')}>
          <ReportRow label={t('tbSuspects', 'TB Suspects Identified')} value={report.disease.tbSuspects} isAlert={report.disease.tbSuspects > 0} />
          <ReportRow label={t('malariaSuspects', 'Malaria Suspects (Fever)')} value={report.disease.malariaSuspects} isAlert={report.disease.malariaSuspects > 0} />
          <ReportRow label={t('leprosySuspects', 'Leprosy Suspects (Skin Patches)')} value={report.disease.leprosySuspects} isAlert={report.disease.leprosySuspects > 0} />
        </ReportSection>

        <ReportSection title={t('specialRegisters')}>
          <ReportRow label={t('pwdMembers')} value="" onDownload={() => handleDownload('PWD')} loading={exporting === 'PWD'} />
          <ReportRow label={t('bplFamilies')} value="" onDownload={() => handleDownload('BPL_FAMILIES')} loading={exporting === 'BPL_FAMILIES'} />
          <ReportRow label={t('pncCases')} value="" onDownload={() => handleDownload('PNC_CASES')} loading={exporting === 'PNC_CASES'} />
        </ReportSection>
      </ScrollView>
    </SafeAreaView>
  );
};

const ReportSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const ReportRow = ({ label, value, isAlert, onDownload, loading }) => (
  <View style={styles.reportRow}>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={[styles.rowValue, isAlert && { color: COLORS.error }]}>{value}</Text>
      {onDownload && (
        <TouchableOpacity style={styles.rowDownloadBtn} onPress={onDownload} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.rowDownloadText}>📥</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: 24, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
  },
  backBtn: { padding: 10, marginRight: 10 },
  backBtnText: { fontSize: 24, color: '#FFF', fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 },
  scrollContent: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontWeight: '600' },
  summaryExportBtn: {
    backgroundColor: COLORS.secondary, padding: 16, borderRadius: 12,
    alignItems: 'center', marginBottom: 20, elevation: 3,
  },
  summaryExportText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14, fontWeight: '800', color: COLORS.textSecondary,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  reportRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  rowLabel: { fontSize: 14, color: COLORS.text, flex: 1, paddingRight: 12 },
  rowValue: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  rowDownloadBtn: {
    marginLeft: 12, backgroundColor: '#F1F5F9', padding: 6, borderRadius: 8,
  },
  rowDownloadText: { fontSize: 14 },
  masterExportBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
  },
  masterExportText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});

export default MPRReportScreen;
