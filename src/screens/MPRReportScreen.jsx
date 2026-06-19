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

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedVillageId, setSelectedVillageId] = useState('all');
  const [villagesList, setVillagesList] = useState([]);
  const [activeTab, setActiveTab] = useState('Overview');
  const [kpiStats, setKpiStats] = useState({ totalFamilies: 0, syncQueueCount: 0, lowStockAlerts: 0, vitalEventsCount: 0 });
  
  // New States for Dynamic UI
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [previewData, setPreviewData] = useState([]);
  const [previewTitle, setPreviewTitle] = useState('');

  useEffect(() => {
    generateReport();
  }, [selectedMonth, selectedYear, selectedVillageId]);

  const generateReport = async () => {
    setLoading(true);
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    const allEvents = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
    const allUsers = await storage.getAll(STORAGE_KEYS.USERS);
    const allVitalEvents = await storage.getAll(STORAGE_KEYS.VITAL_EVENTS);
    const allVhndSessions = await storage.getAll(STORAGE_KEYS.VHND_SESSIONS);
    const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
    const allStock = await storage.getAll(STORAGE_KEYS.STOCK);
    const allVillages = await storage.getAll(STORAGE_KEYS.VILLAGES);

    // 1. Resolve and set local villages list based on role scope
    let finalVillages = [];
    if (user?.role === 'ASHA') {
      const assigned = user.assignedVillages || [];
      finalVillages = assigned.map(v => {
        const vId = typeof v === 'string' ? v : (v.id || v.villageId || v.value);
        const actualVillage = allVillages.find(vil => vil.id === vId);
        return actualVillage ? { id: actualVillage.id, name: actualVillage.name } : null;
      }).filter(Boolean);

      if (finalVillages.length === 0 && user.villageId) {
        const primaryVil = allVillages.find(vil => vil.id === user.villageId);
        finalVillages.push({ id: user.villageId, name: primaryVil ? primaryVil.name : (user.village || 'My Village') });
      }
    } else if (user?.role === 'ANM' || user?.role === 'MPW' || user?.role === 'CHO') {
      finalVillages = allVillages.filter(v => v.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      const allSubCenters = await storage.getAll(STORAGE_KEYS.SUB_CENTERS);
      const scIds = new Set(allSubCenters.filter(sc => sc.phcId === user.phcId).map(sc => sc.id));
      finalVillages = allVillages.filter(v => scIds.has(v.subCenterId));
    } else {
      finalVillages = allVillages;
    }
    setVillagesList(finalVillages);

    // 2. Filter data by user jurisdiction
    let members = allMembers;
    let events = allEvents;
    let vitalEvents = allVitalEvents;
    let vhndSessions = allVhndSessions;
    let families = allFamilies;
    let stock = allStock;
    let currentAshaName = user?.name;

    if (user?.role === 'ASHA') {
      const assignedIds = new Set(finalVillages.map(v => v.id));
      members = allMembers.filter(m => !m.villageId || m.ashaId === user.id || assignedIds.has(m.villageId));
      events = allEvents.filter(e => e.payload?.ashaId === user.id || assignedIds.has(e.payload?.villageId));
      vitalEvents = allVitalEvents.filter(e => e.ashaId === user.id || assignedIds.has(e.villageId));
      vhndSessions = allVhndSessions.filter(s => s.ashaId === user.id || assignedIds.has(s.villageId));
      families = allFamilies.filter(f => f.ashaId === user.id || assignedIds.has(f.villageId));
      stock = allStock.filter(s => s.ashaId === user.id || assignedIds.has(s.villageId));
    } else if (user?.role === 'ANM' || user?.role === 'MPW' || user?.role === 'CHO') {
      members = allMembers.filter(m => m.subCenterId === user.subCenterId);
      events = allEvents.filter(e => e.payload?.subCenterId === user.subCenterId);
      vitalEvents = allVitalEvents.filter(e => e.subCenterId === user.subCenterId);
      vhndSessions = allVhndSessions.filter(s => s.subCenterId === user.subCenterId);
      families = allFamilies.filter(f => f.subCenterId === user.subCenterId);
      stock = allStock.filter(s => s.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      members = allMembers.filter(m => m.phcId === user.phcId);
      events = allEvents.filter(e => e.payload?.phcId === user.phcId);
      vitalEvents = allVitalEvents.filter(e => e.phcId === user.phcId);
      vhndSessions = allVhndSessions.filter(s => s.phcId === user.phcId);
      families = allFamilies.filter(f => f.phcId === user.phcId);
      stock = allStock.filter(s => s.phcId === user.phcId);
    }

    // 3. Apply selected village filter from toolbar
    if (selectedVillageId && selectedVillageId !== 'all') {
      members = members.filter(m => m.villageId === selectedVillageId);
      events = events.filter(e => e.payload?.villageId === selectedVillageId);
      vitalEvents = vitalEvents.filter(e => e.villageId === selectedVillageId);
      vhndSessions = vhndSessions.filter(s => s.villageId === selectedVillageId);
      families = families.filter(f => f.villageId === selectedVillageId);
      stock = stock.filter(s => s.villageId === selectedVillageId);
    }

    // 4. Find ASHA name if applicable
    if (user?.role !== 'ASHA' && members.length > 0) {
      const firstMember = members[0];
      const asha = allUsers.find(u => u.id === firstMember.ashaId);
      if (asha) currentAshaName = asha.name;
    }

    // 5. Calculate KPI values
    const lowStockItems = stock.filter(s => {
      if (s.id === 'quick_stock_ors' || s.name?.toLowerCase().includes('ors')) return (s.quantity ?? 100) < 50;
      if (s.id === 'quick_stock_ifa' || s.name?.toLowerCase().includes('ifa')) return (s.quantity ?? 500) < 200;
      return (s.quantity ?? 0) < 50;
    });

    setKpiStats({
      totalFamilies: families.length,
      bplFamilies: families.filter(f => f.isBPL).length,
      pwdMembers: members.filter(m => m.isPwd).length,
      totalMembers: members.length,
      vhndSessions: vhndSessions.length,
      pncCases: members.filter(m => m.healthData?.pncStatus === 'Pending' || m.healthData?.pncStatus === 'Active' || m.healthData?.pncStatus === 'active').length,
      syncQueueCount: events.length,
      lowStockAlerts: lowStockItems.length,
      vitalEventsCount: vitalEvents.length
    });

    // 6. Generate report stats using selected month and year
    const stats = generateMPRStats(members, vitalEvents, vhndSessions, events, selectedMonth, selectedYear);
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
        case 'HOSPITAL_DELIVERIES':
          success = await exportVitalEvents(user, 'Birth', 'Hospital');
          break;
        case 'HOME_DELIVERIES':
          success = await exportVitalEvents(user, 'Birth', 'Home');
          break;
        case 'INFANT_DEATHS':
          success = await exportVitalEvents(user, 'Death', null, true);
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

  const showPreview = (type, title) => {
    setPreviewTitle(title);
    // Generate a simple preview based on the type (mocking actual data extraction for UI)
    let data = [];
    if (type === 'FAMILIES') data = [{ id: 1, name: 'Family A', status: 'Active' }, { id: 2, name: 'Family B', status: 'Active' }];
    else if (type === 'SYNC') data = [{ id: 1, type: 'Vital Event', status: 'Pending' }, { id: 2, type: 'Member Reg', status: 'Pending' }];
    else if (type === 'STOCK') data = [{ id: 1, item: 'ORS', qty: 20 }, { id: 2, item: 'IFA', qty: 150 }];
    else if (type === 'VITAL') data = [{ id: 1, event: 'Birth', date: '2026-06-10' }, { id: 2, event: 'Death', date: '2026-06-12' }];
    setPreviewData(data);
    // In a real implementation, you'd extract the actual 5 rows from the respective filtered array
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
          <Text style={styles.headerSubtitle}>{ashaName || t('ashaMpr')} • {report?.monthName} {report?.year}</Text>
        </View>
        <TouchableOpacity 
          style={styles.masterExportBtn} 
          onPress={() => handleDownload(null)}
          disabled={exporting !== null}
        >
          <Text style={styles.masterExportText}>📊 Master</Text>
        </TouchableOpacity>
      </View>

      {/* Collapsible Filter Accordion */}
      <TouchableOpacity 
        style={styles.accordionHeader} 
        onPress={() => setFiltersExpanded(!filtersExpanded)}
      >
        <Text style={styles.accordionTitle}>⚙️ {t('filters', 'Report Filters')}</Text>
        <Text style={styles.accordionIcon}>{filtersExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {filtersExpanded && (
        <View style={styles.toolbar}>
          <View style={styles.toolbarSection}>
            <Text style={styles.toolbarLabel}>{t('riskLevel', 'Risk Level')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {['all', 'high', 'normal'].map((risk) => (
                <TouchableOpacity
                  key={risk}
                  style={[styles.chip, selectedRiskLevel === risk && styles.chipActive]}
                  onPress={() => setSelectedRiskLevel(risk)}
                >
                  <Text style={[styles.chipText, selectedRiskLevel === risk && styles.chipTextActive]}>{risk.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.toolbarSection}>
            <Text style={styles.toolbarLabel}>{t('month', 'Month')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((mName, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.chip, selectedMonth === idx && styles.chipActive]}
                  onPress={() => setSelectedMonth(idx)}
                >
                  <Text style={[styles.chipText, selectedMonth === idx && styles.chipTextActive]}>{mName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.toolbarSection}>
            <Text style={styles.toolbarLabel}>{t('year', 'Year')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {[2025, 2026, 2027].map((yr) => (
                <TouchableOpacity
                  key={yr}
                  style={[styles.chip, selectedYear === yr && styles.chipActive]}
                  onPress={() => setSelectedYear(yr)}
                >
                  <Text style={[styles.chipText, selectedYear === yr && styles.chipTextActive]}>{yr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {villagesList.length > 0 && (
            <View style={styles.toolbarSection}>
              <Text style={styles.toolbarLabel}>{t('village', 'Village')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                <TouchableOpacity
                  style={[styles.chip, selectedVillageId === 'all' && styles.chipActive]}
                  onPress={() => setSelectedVillageId('all')}
                >
                  <Text style={[styles.chipText, selectedVillageId === 'all' && styles.chipTextActive]}>All Villages</Text>
                </TouchableOpacity>
                {villagesList.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.chip, selectedVillageId === v.id && styles.chipActive]}
                    onPress={() => setSelectedVillageId(v.id)}
                  >
                    <Text style={[styles.chipText, selectedVillageId === v.id && styles.chipTextActive]}>{v.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top-Level KPI Strip (Interactive) */}
        <View style={styles.kpiStrip}>
          <TouchableOpacity style={styles.kpiCard} onPress={() => showPreview('FAMILIES', 'Families Overview')}>
            <Text style={styles.kpiVal}>{kpiStats.totalFamilies}</Text>
            <Text style={styles.kpiLabel}>{t('families', 'Families')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.kpiCard} onPress={() => showPreview('SYNC', 'Pending Sync Data')}>
            <Text style={[styles.kpiVal, kpiStats.syncQueueCount > 0 && { color: COLORS.error }]}>
              {kpiStats.syncQueueCount}
            </Text>
            <Text style={styles.kpiLabel}>{t('pendingSync', 'Pending Sync')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.kpiCard} onPress={() => showPreview('STOCK', 'Low Stock Alerts')}>
            <Text style={[styles.kpiVal, kpiStats.lowStockAlerts > 0 && { color: COLORS.error }]}>
              {kpiStats.lowStockAlerts}
            </Text>
            <Text style={styles.kpiLabel}>{t('lowStock', 'Low Stock')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.kpiCard} onPress={() => showPreview('VITAL', 'Vital Events Log')}>
            <Text style={styles.kpiVal}>{kpiStats.vitalEventsCount}</Text>
            <Text style={styles.kpiLabel}>{t('vitalEvents', 'Vital Events')}</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Excel Preview Section */}
        {previewData.length > 0 && (
          <View style={styles.previewSection}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>👁️ Preview: {previewTitle}</Text>
              <TouchableOpacity onPress={() => setPreviewData([])}><Text style={styles.closePreview}>×</Text></TouchableOpacity>
            </View>
            <View style={styles.previewTable}>
              {previewData.map((row, idx) => (
                <View key={idx} style={styles.previewRow}>
                  {Object.values(row).map((val, i) => (
                    <Text key={i} style={styles.previewCell} numberOfLines={1}>{String(val)}</Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tab Segment Selector */}
        <View style={styles.tabContainer}>
          {['Overview', 'Demographics', 'Health Metrics', 'Inventory'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'Overview' && (
          <View>
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

            <ReportSection title={t('specialRegisters', 'Special Registers & Master')}>
              <ReportRow label={t('pwdMembers', 'PWD Members')} value={kpiStats.pwdMembers || 0} onDownload={() => handleDownload('PWD')} loading={exporting === 'PWD'} />
              <ReportRow label={t('bplFamilies', 'BPL Families')} value={kpiStats.bplFamilies || 0} onDownload={() => handleDownload('BPL_FAMILIES')} loading={exporting === 'BPL_FAMILIES'} />
              <ReportRow label={t('vhndSessionLog', 'VHND Session Log')} value={kpiStats.vhndSessions || 0} onDownload={() => handleDownload('VHND_SESSIONS')} loading={exporting === 'VHND_SESSIONS'} />
              <ReportRow label={t('masterPopulation', 'Master Population')} value={kpiStats.totalMembers || 0} onDownload={() => handleDownload(null)} loading={exporting === null && loading} />
            </ReportSection>
          </View>
        )}

        {activeTab === 'Demographics' && (
          <ReportSection title={t('demographics', 'Demographics & Family Planning')}>
            <ReportRow label={t('children05yrs', 'Children (0-5 Years)')} value={report.child.samChildren + report.child.mamChildren + report.child.fullyImmunized} onDownload={() => handleDownload('CHILDREN_0_5')} loading={exporting === 'CHILDREN_0_5'} />
            <ReportRow label={t('eligibleCouples', 'Eligible Couples')} value={report.fp.totalEC} onDownload={() => handleDownload('ELIGIBLE_COUPLE')} loading={exporting === 'ELIGIBLE_COUPLE'} />
            <ReportRow label={t('permanent', 'Permanent Methods')} value={report.fp.sterilization} onDownload={() => handleDownload('FP_PERMANENT')} loading={exporting === 'FP_PERMANENT'} />
            <ReportRow label={t('temporary', 'Temporary Methods')} value={report.fp.spacing} onDownload={() => handleDownload('FP_SPACING')} loading={exporting === 'FP_SPACING'} />
            <ReportRow label={t('noMethodUnmet', 'Unmet Need / No Method')} value={report.fp.none} isAlert={report.fp.none > 0} onDownload={() => handleDownload('FP_NONE')} loading={exporting === 'FP_NONE'} />
            <ReportRow label={t('fpRegisterDownload', 'FP Register')} value={report.fp.totalEC} onDownload={() => handleDownload('FP_REGISTER')} loading={exporting === 'FP_REGISTER'} />
          </ReportSection>
        )}

        {activeTab === 'Health Metrics' && (
          <View>
            <ReportSection title={t('maternalHealth', 'Maternal Health')}>
              <ReportRow label={t('totalAncReg', 'Total ANC Registered')} value={report.maternal.newANC} onDownload={() => handleDownload('NEW_ANC')} loading={exporting === 'NEW_ANC'} />
              <ReportRow label={t('highRiskPreg', 'High Risk Pregnancies')} value={report.maternal.highRiskTotal} isAlert={report.maternal.highRiskTotal > 0} onDownload={() => handleDownload('HIGH_RISK_ANC')} loading={exporting === 'HIGH_RISK_ANC'} />
              <ReportRow label={t('severeAnemiaHb', 'Severe Anemia (Hb < 7)')} value={report.maternal.severeAnemia} isAlert={report.maternal.severeAnemia > 0} onDownload={() => handleDownload('SEVERE_ANEMIA')} loading={exporting === 'SEVERE_ANEMIA'} />
              <ReportRow label={t('hospDel', 'Hospital Deliveries')} value={report.maternal.hospitalDeliveries} onDownload={() => handleDownload('HOSPITAL_DELIVERIES')} loading={exporting === 'HOSPITAL_DELIVERIES'} />
              <ReportRow label={t('homeDel', 'Home Deliveries')} value={report.maternal.homeDeliveries} onDownload={() => handleDownload('HOME_DELIVERIES')} loading={exporting === 'HOME_DELIVERIES'} />
              <ReportRow label={t('pendingAncFollowup', 'Pending ANC Followup')} value={report.maternal.pendingANC} isAlert={report.maternal.pendingANC > 0} onDownload={() => handleDownload('PENDING_ANC')} loading={exporting === 'PENDING_ANC'} />
              <ReportRow label={t('pncCases', 'PNC Cases')} value={kpiStats.pncCases || 0} onDownload={() => handleDownload('PNC_CASES')} loading={exporting === 'PNC_CASES'} />
            </ReportSection>

            <ReportSection title={t('childHealthNutrition', 'Child Health & Nutrition')}>
              <ReportRow label={t('samChildren', 'SAM Children')} value={report.child.samChildren} isAlert={report.child.samChildren > 0} onDownload={() => handleDownload('SAM_CHILDREN')} loading={exporting === 'SAM_CHILDREN'} />
              <ReportRow label={t('mamChildren', 'MAM Children')} value={report.child.mamChildren} isAlert={report.child.mamChildren > 0} onDownload={() => handleDownload('MAM_CHILDREN')} loading={exporting === 'MAM_CHILDREN'} />
              <ReportRow label={t('fullyImmunized', 'Fully Immunized (1yr+)')} value={report.child.fullyImmunized} onDownload={() => handleDownload('FULLY_IMMUNIZED')} loading={exporting === 'FULLY_IMMUNIZED'} />
            </ReportSection>

            <ReportSection title={t('vitalEvents', 'Vital Events')}>
              <ReportRow label={t('totalBirths', 'Total Births')} value={report.vital.births} onDownload={() => handleDownload('VITAL_BIRTHS')} loading={exporting === 'VITAL_BIRTHS'} />
              <ReportRow label={t('totalDeaths', 'Total Deaths')} value={report.vital.deaths} onDownload={() => handleDownload('VITAL_DEATHS')} loading={exporting === 'VITAL_DEATHS'} />
              <ReportRow label={t('infantDeaths', 'Infant Deaths')} value={report.vital.infantDeaths} isAlert={report.vital.infantDeaths > 0} onDownload={() => handleDownload('INFANT_DEATHS')} loading={exporting === 'INFANT_DEATHS'} />
            </ReportSection>

            <ReportSection title={t('diseaseSurveillance', 'Disease Surveillance')}>
              <ReportRow label={t('tbSuspects', 'TB Suspects Identified')} value={report.disease.tbSuspects} isAlert={report.disease.tbSuspects > 0} onDownload={() => handleDownload('TB_SUSPECTS')} loading={exporting === 'TB_SUSPECTS'} />
              <ReportRow label={t('malariaSuspects', 'Malaria Suspects (Fever)')} value={report.disease.malariaSuspects} isAlert={report.disease.malariaSuspects > 0} onDownload={() => handleDownload('MALARIA_SUSPECTS')} loading={exporting === 'MALARIA_SUSPECTS'} />
              <ReportRow label={t('leprosySuspects', 'Leprosy Suspects (Skin Patches)')} value={report.disease.leprosySuspects} isAlert={report.disease.leprosySuspects > 0} onDownload={() => handleDownload('LEPROSY_SUSPECTS')} loading={exporting === 'LEPROSY_SUSPECTS'} />
            </ReportSection>

            <ReportSection title={t('ncdScreeningSection', 'NCD Screening')}>
              <ReportRow label={t('totalNcdScreenings', 'Total NCD Screenings')} value={report.ncd.screened} onDownload={() => handleDownload('NCD_SCREENING')} loading={exporting === 'NCD_SCREENING'} />
            </ReportSection>
          </View>
        )}

        {activeTab === 'Inventory' && (
          <ReportSection title={t('stockLedger', 'Stock Distribution')}>
            <ReportRow label={t('ironTablets', 'Iron IFA Tablets Distributed')} value={report.stock.ironDistributed} />
            <ReportRow label={t('orsPackets', 'ORS Packets Distributed')} value={report.stock.orsDistributed} />
            <ReportRow label={t('condoms', 'Condoms Distributed')} value={report.stock.condomsDistributed} />
          </ReportSection>
        )}
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
            <Text style={styles.rowDownloadText}>📥 Export</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: 20, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  backBtn: { padding: 8, marginRight: 8 },
  backBtnText: { fontSize: 24, color: '#FFF', fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontWeight: '600' },
  
  // Accordion styles
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  accordionIcon: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Toolbar styles
  toolbar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  toolbarSection: {
    marginBottom: 8,
  },
  toolbarLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FAFAFA',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#FFF',
  },

  // KPI Strip
  kpiStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // Preview styles
  previewSection: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  closePreview: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D97706',
    marginTop: -4,
  },
  previewTable: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  previewCell: {
    flex: 1,
    fontSize: 10,
    color: COLORS.text,
  },

  // Tabs container
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.surface,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },

  // Section styles
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8,
    shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  reportRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  rowLabel: { fontSize: 13, color: COLORS.text, flex: 1, paddingRight: 8 },
  rowValue: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  rowDownloadBtn: {
    marginLeft: 12, backgroundColor: '#F0F9FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: '#E0F2FE',
  },
  rowDownloadText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  
  summaryExportBtn: {
    backgroundColor: COLORS.secondary, padding: 16, borderRadius: 12,
    alignItems: 'center', marginBottom: 20, elevation: 2,
  },
  summaryExportText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  masterExportBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
  },
  masterExportText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});

export default MPRReportScreen;
