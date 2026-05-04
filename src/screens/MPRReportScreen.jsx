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

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    const members = await storage.getAll(STORAGE_KEYS.MEMBERS);
    const events = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
    const stats = generateMPRStats(members, events);
    setReport(stats);
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
        <Text style={styles.loadingText}>Generating Monthly Report...</Text>
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
          <Text style={styles.headerTitle}>Monthly Progress Report</Text>
          <Text style={styles.headerSubtitle}>ASHA MPR • {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
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
            <Text style={styles.summaryExportText}>📥 Download Full MPR Summary (Excel)</Text>
          )}
        </TouchableOpacity>

        <ReportSection title="1. Maternal Health">
          <ReportRow label="Total ANC Registrations" value={report.maternal.newANC} onDownload={() => handleDownload('NEW_ANC')} loading={exporting === 'NEW_ANC'} />
          <ReportRow label="High-Risk Pregnancies" value={report.maternal.highRiskTotal} isAlert={report.maternal.highRiskTotal > 0} onDownload={() => handleDownload('HIGH_RISK_ANC')} loading={exporting === 'HIGH_RISK_ANC'} />
          <ReportRow label="Severe Anemia (Hb < 7)" value={report.maternal.severeAnemia} isAlert={report.maternal.severeAnemia > 0} onDownload={() => handleDownload('SEVERE_ANEMIA')} loading={exporting === 'SEVERE_ANEMIA'} />
          <ReportRow label="Hospital Deliveries" value={report.maternal.hospitalDeliveries} />
          <ReportRow label="Home Deliveries" value={report.maternal.homeDeliveries} />
          <ReportRow label="Pending ANC Follow-up" value={report.maternal.pendingANC} isAlert={report.maternal.pendingANC > 0} />
        </ReportSection>

        <ReportSection title="2. Child Health & Nutrition">
          <ReportRow label="Children (0-5 yrs)" value={report.child.samChildren + report.child.fullyImmunized} onDownload={() => handleDownload('CHILDREN_0_5')} loading={exporting === 'CHILDREN_0_5'} />
          <ReportRow label="SAM Children" value={report.child.samChildren} isAlert={report.child.samChildren > 0} onDownload={() => handleDownload('SAM_CHILDREN')} loading={exporting === 'SAM_CHILDREN'} />
          <ReportRow label="Fully Immunized" value={report.child.fullyImmunized} />
        </ReportSection>

        <ReportSection title="3. Vital Events">
          <ReportRow label="Total Births" value={report.vital.births} onDownload={() => handleDownload('VITAL_BIRTHS')} loading={exporting === 'VITAL_BIRTHS'} />
          <ReportRow label="Total Deaths" value={report.vital.deaths} onDownload={() => handleDownload('VITAL_DEATHS')} loading={exporting === 'VITAL_DEATHS'} />
          <ReportRow label="Infant Deaths" value={report.vital.infantDeaths} isAlert={report.vital.infantDeaths > 0} />
        </ReportSection>

        <ReportSection title="4. Family Planning">
          <ReportRow label={t('eligibleCouples')} value={report.fp.totalEC} onDownload={() => handleDownload('ELIGIBLE_COUPLE')} loading={exporting === 'ELIGIBLE_COUPLE'} />
          <ReportRow label={t('permanent')} value={report.fp.sterilization} />
          <ReportRow label={t('temporary')} value={report.fp.spacing} />
          <ReportRow label="No Method (Unmet Need)" value={report.fp.none} isAlert={report.fp.none > 0} />
          <ReportRow label="FP Register Download" value="" onDownload={() => handleDownload('FP_REGISTER')} loading={exporting === 'FP_REGISTER'} />
        </ReportSection>

        <ReportSection title="5. Stock Consumption">
          <ReportRow label="Iron (IFA) Tablets" value={report.stock.ironDistributed} />
          <ReportRow label="ORS Packets" value={report.stock.orsDistributed} />
          <ReportRow label="Condoms" value={report.stock.condomsDistributed} />
          <ReportRow label="VHND Session Log" value="" onDownload={() => handleDownload('VHND_SESSIONS')} loading={exporting === 'VHND_SESSIONS'} />
        </ReportSection>

        <ReportSection title="6. NCD & Screening">
          <ReportRow label="Total BP/Sugar Screenings" value={report.ncd.screened} onDownload={() => handleDownload('NCD_SCREENING')} loading={exporting === 'NCD_SCREENING'} />
        </ReportSection>

        <ReportSection title="7. Special Registers">
          <ReportRow label="PwD Members" value="" onDownload={() => handleDownload('PWD')} loading={exporting === 'PWD'} />
          <ReportRow label="BPL Families" value="" onDownload={() => handleDownload('BPL_FAMILIES')} loading={exporting === 'BPL_FAMILIES'} />
          <ReportRow label="PNC Cases" value="" onDownload={() => handleDownload('PNC_CASES')} loading={exporting === 'PNC_CASES'} />
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
