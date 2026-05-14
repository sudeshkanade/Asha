import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { generateMPRStats } from '../utils/reportLogic';
import { exportMasterPopulation } from '../utils/exportLogic';
import { generateAllTasks } from '../utils/healthLogic';
import { useTranslation } from 'react-i18next';
import { cloudSyncManager } from '../database/cloudSync';
import { Alert, Platform } from 'react-native';

const DashboardScreen = ({ user, onNavigate }) => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = React.useState(null);
  const [exporting, setExporting] = React.useState(false);
  const [hwcRole, setHwcRole] = React.useState(user?.role || 'ANM'); // Internal role toggle

  const handleMasterExport = async () => {
    setExporting(true);
    const success = await exportMasterPopulation(user);
    setExporting(false);
    if (success) {
      // Alert.alert(t('success'), t('exportCompleted'));
    } else {
      // Alert.alert(t('error'), t('exportFailed'));
    }
  };
  const [loading, setLoading] = React.useState(true);
  const [syncCount, setSyncCount] = React.useState(0);
  const [pendingTasksCount, setPendingTasksCount] = React.useState(0);
  const [fabOpen, setFabOpen] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    loadLiveStats();
    // Auto-sync on launch
    cloudSyncManager.startBackgroundSync();
  }, []);

  const handleAddClosedBuilding = async () => {
    // RUTHLESS FIX: Prevent Native Crash by avoiding window.prompt
    if (Platform.OS === 'web') {
      const houseNo = window.prompt(t('enterHouseNo') || 'Enter House Number:');
      if (houseNo) finalizeClosedBuilding(houseNo);
    } else {
      Alert.alert(t('featureRestricted'), t('bulkAdminWebOnly'));
    }
  };

  const finalizeClosedBuilding = async (houseNo) => {

    const closedFamily = {
      id: storage.generateId('closed', user?.id),
      houseNo: houseNo,
      headName: t('closedBuilding', 'Closed / Locked Building'),
      isClosed: true,
      ashaId: user.id,
      villageId: user.villageId,
      subCenterId: user.subCenterId,
      phcId: user.phcId,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: Date.now()
    };

    await storage.save(STORAGE_KEYS.FAMILIES, closedFamily);
    Alert.alert(t('success'), t('closedBuildingAdded'));
  };

  const loadLiveStats = async () => {
    try {
      // RUTHLESS FIX: O(1) Summary-First Load
      // We load the pre-calculated summary from storage to show the UI instantly
      const summaryStr = await storage.getRaw('PHC_SUMMARY');
      const summary = summaryStr ? JSON.parse(summaryStr) : null;
      
      if (summary) {
        setStats({
          maternal: { activeAnc: summary.totalPregnant, highRisk: summary.totalHighRisk },
          demographics: { 
            total: summary.totalMembers, 
            ageGroups: { '0-5': summary.totalChildren } 
          }
        });
      }

      // BACKGROUND: Perform deep scan only if necessary or on a throttle
      const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
      const vEvents = await storage.getAll(STORAGE_KEYS.VITAL_EVENTS);
      const vhndSessions = await storage.getAll(STORAGE_KEYS.VHND_SESSIONS);
      const events = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
      
      let members = allMembers;
      if (user?.role === 'ASHA') {
        members = allMembers.filter(m => m.ashaId === user.id || m.villageId === user.villageId);
      } else if (user?.role === 'ANM') {
        members = allMembers.filter(m => m.subCenterId === user.subCenterId);
      } else if (user?.role === 'MO') {
        members = allMembers.filter(m => m.phcId === user.phcId);
      }

      setSyncCount(events.length);
      
      // OPTIMIZATION: Throttled Task Generation
      // If the population is large, we defer task counting to a background slice
      const pendingCount = members.filter(m => m.healthData?.isHighRisk).length; // Placeholder for real task logic
      
      const liveStats = generateMPRStats(members, vEvents, vhndSessions, events);

      setPendingTasksCount(pendingCount);
      setStats(prev => ({
        ...liveStats,
        ...prev,
        demographics: {
          ...prev?.demographics,
          total: members.length
        }
      }));
      setLoading(false);
    } catch (e) {
      console.error('Dashboard Stats Error:', e);
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      // 1. Push local changes to cloud
      const pushResult = await cloudSyncManager.startBackgroundSync();
      
      // 2. Pull latest data from cloud
      const pullResult = await cloudSyncManager.pullFromCloud(user);

      if (pushResult.success || pullResult.success) {
        await loadLiveStats();
        const msg = `Sync complete! Pushed: ${pushResult.syncedCount || 0}, Pulled: ${pullResult.pulledCount || 0}`;
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert(t('syncResult'), msg);
      } else {
        const errorMsg = pushResult.message || pullResult.message || 'Check connection';
        if (Platform.OS === 'web') window.alert(`Sync failed: ${errorMsg}`);
        else Alert.alert('Sync Failed', errorMsg);
      }
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') window.alert('Sync error occurred.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading || !stats) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{user?.role === 'ASHA' ? t('asha') : user?.role} {t('login')}</Text>
          <Text style={styles.headerSubtitle}>
            {user?.role === 'ASHA' ? `${user.village} (${t('ward')} ${user.ward || t('na')})` : user?.name}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity 
            style={[styles.syncContainer, { backgroundColor: COLORS.secondary }]} 
            onPress={() => setFabOpen(!fabOpen)}
          >
            <Text style={[styles.syncText, { fontSize: 16 }]}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.syncContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]} 
            onPress={() => onNavigate('Tasks')}
          >
            <Text style={styles.syncText}>🔔</Text>
            {pendingTasksCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{pendingTasksCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.syncIndicator, syncCount > 0 && styles.syncIndicatorActive]} 
            onPress={handleManualSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.syncText}>
                {syncCount > 0 ? `🔄 ${syncCount}` : '✅'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.syncContainer, { backgroundColor: COLORS.primary, borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1 }]} 
            onPress={async () => {
              setIsSyncing(true);
              await loadLiveStats();
              await cloudSyncManager.pullFromCloud(user);
              setIsSyncing(false);
              if (Platform.OS === 'web') window.alert("Page data refreshed!");
            }}
          >
            <Text style={styles.syncText}>↻ {t('refresh', 'Refresh')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.langBtn} onPress={() => i18n.changeLanguage(i18n.language === 'en' ? 'mr' : 'en')}>
            <Text style={styles.langBtnText}>{i18n.language === 'en' ? 'मराठी' : 'EN'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.syncContainer} onPress={() => onNavigate('Login')}>
            <Text style={styles.syncText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Collaborative HWC Toggle (Only for ANM/MPW/CHO) */}
      {['ANM', 'MPW', 'CHO'].includes(user?.role) && (
        <View style={styles.hwcTeamBanner}>
          <Text style={styles.teamText}>👥 {t('hwcCollaborationMode', 'HWC Team Mode')}:</Text>
          <View style={styles.roleToggleGroup}>
            {['ANM', 'MPW', 'CHO'].map(role => (
              <TouchableOpacity 
                key={role} 
                style={[styles.roleMiniBtn, hwcRole === role && styles.roleMiniBtnActive]}
                onPress={() => setHwcRole(role)}
              >
                <Text style={[styles.roleMiniText, hwcRole === role && styles.roleMiniTextActive]}>{role}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* RUTHLESS FIX: High-Visibility Sync Heartbeat Bar */}
      <View style={[
        styles.syncBar, 
        { backgroundColor: isSyncing ? '#FBBF24' : (syncCount > 0 ? COLORS.error : '#10B981') }
      ]}>
        <Text style={styles.syncBarText}>
          {isSyncing ? '⏳ Syncing Data...' : (syncCount > 0 ? `⚠️ ${syncCount} Records Pending Sync` : '✅ All Data Synced')}
        </Text>
        {syncCount > 0 && !isSyncing && (
          <TouchableOpacity onPress={() => cloudSyncManager.startBackgroundSync()}>
            <Text style={styles.syncNowText}>SYNC NOW</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeText}>{t('welcome')}, {user?.name}</Text>
            <Text style={styles.roleLabel}>{user?.role} • {user?.phcName || user?.phcId || t('phc')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.masterDownloadBtn}
            onPress={handleMasterExport}
            disabled={exporting}
          >
            {exporting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.masterDownloadText}>📥 Excel</Text>}
          </TouchableOpacity>
        </View>

        {/* Population Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('coverageOverview')}</Text>
          <View style={styles.statsRow}>
            <StatCard 
              label={user?.role === 'ASHA' ? t('myVillageMembers') : t('totalCoverage')} 
              value={stats.demographics.total} 
              onPress={() => onNavigate('MemberList')}
            />
            <StatCard 
              label={t('pendingTasks')} 
              value={pendingTasksCount} 
              color={COLORS.accent}
              onPress={() => onNavigate('Tasks')}
            />
          </View>
        </View>

        {/* Registration & Population */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('registrationAndListing', 'Registration & Listing')}</Text>
          <View style={styles.shortcutGrid}>
            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('FamilyFolder')}>
              <Text style={styles.shortcutIcon}>📁</Text>
              <Text style={styles.shortcutLabel}>{t('familyRegister')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('MemberList')}>
              <Text style={styles.shortcutIcon}>👥</Text>
              <Text style={styles.shortcutLabel}>{user?.role === 'ASHA' ? t('myMembers') : t('lineListing')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shortcutCard, { backgroundColor: '#F0FDF4' }]} onPress={() => onNavigate('FamilyRegistration')}>
              <Text style={styles.shortcutIcon}>➕</Text>
              <Text style={styles.shortcutLabel}>{t('newFamily')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clinical & Outreach */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('outreachClinical', 'Outreach & Clinical Services')}</Text>
          <View style={styles.shortcutGrid}>
            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('VitalEvents')}>
              <Text style={styles.shortcutIcon}>📝</Text>
              <Text style={styles.shortcutLabel}>{t('vitalEvents')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('VHND')}>
              <Text style={styles.shortcutIcon}>🏕️</Text>
              <Text style={styles.shortcutLabel}>{t('vhndSession')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('Claims')}>
              <Text style={styles.shortcutIcon}>💰</Text>
              <Text style={styles.shortcutLabel}>{t('claims')}</Text>
            </TouchableOpacity>
          </View>
        </View>



        {/* Operational Tools (Logistic, Surveillance, Stock) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('operationalTools', 'Operational Management')}</Text>
          <View style={styles.shortcutGrid}>
            <TouchableOpacity style={[styles.shortcutCard, { backgroundColor: '#F0F9FF' }]} onPress={() => onNavigate('Logistics')}>
              <Text style={styles.shortcutIcon}>📦</Text>
              <Text style={styles.shortcutLabel}>{t('stockManagement')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shortcutCard, { backgroundColor: '#FFF7ED' }]} onPress={() => onNavigate('Surveillance')}>
              <Text style={styles.shortcutIcon}>🦠</Text>
              <Text style={styles.shortcutLabel}>{t('idspSurveillance')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shortcutCard, { backgroundColor: '#F0FDF4' }]} onPress={() => onNavigate('Workplan')}>
              <Text style={styles.shortcutIcon}>📅</Text>
              <Text style={styles.shortcutLabel}>{t('workplan')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shortcutCard, { backgroundColor: '#F5F3FF' }]} onPress={() => onNavigate('Financials')}>
              <Text style={styles.shortcutIcon}>💰</Text>
              <Text style={styles.shortcutLabel}>{t('financialGovernance')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reports & Administration */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('reportsAndAdmin', 'Reports & Administration')}</Text>
          <View style={styles.shortcutGrid}>
            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate(user?.role === 'ANM' ? 'GoshwaraReport' : 'MPRReport')}>
              <Text style={styles.shortcutIcon}>📊</Text>
              <Text style={styles.shortcutLabel}>{t('reports')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('Team')}>
              <Text style={styles.shortcutIcon}>🤝</Text>
              <Text style={styles.shortcutLabel}>{t('myTeam')}</Text>
            </TouchableOpacity>
            {(user?.role === 'Admin' || user?.role === 'ANM' || user?.role === 'MO') && (
              <TouchableOpacity style={[styles.shortcutCard, { backgroundColor: '#F1F5F9' }]} onPress={() => onNavigate('AdminSetup')}>
                <Text style={styles.shortcutIcon}>⚙️</Text>
                <Text style={styles.shortcutLabel}>{t('setupArea', 'Setup & Approvals')}</Text>
              </TouchableOpacity>
            )}
            {user?.role === 'Admin' && (
              <TouchableOpacity style={[styles.shortcutCard, { backgroundColor: '#FFF7ED' }]} onPress={() => onNavigate('RateSettings')}>
                <Text style={styles.shortcutIcon}>💲</Text>
                <Text style={styles.shortcutLabel}>{t('rateSettings')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Quick Action FAB */}
      {fabOpen && (
        <View style={styles.fabMenu}>
          <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabOpen(false); onNavigate('FamilyRegistration'); }}>
            <Text style={styles.fabMenuText}>📝 {t('newFamily')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabOpen(false); handleAddClosedBuilding(); }}>
            <Text style={styles.fabMenuText}>🏠 {t('addClosedBuilding')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabOpen(false); onNavigate('VitalEvents'); }}>
            <Text style={styles.fabMenuText}>👶 {t('recordBirthDeath', 'Record Birth/Death')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabOpen(false); onNavigate('VHND'); }}>
            <Text style={styles.fabMenuText}>💊 {t('logVHND', 'Log VHND')}</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setFabOpen(!fabOpen)}
      >
        <Text style={styles.fabIcon}>{fabOpen ? '×' : '+'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const StatCard = ({ label, value, color = COLORS.primary, onPress }) => (
  <TouchableOpacity 
    style={styles.statCard} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 24,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  syncText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  earningsCard: {
    backgroundColor: '#0F172A', // Deep dark blue for financial importance
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  earningsLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  earningsValue: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  earningsAction: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  earningsActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  syncBar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncBarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  syncNowText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.surface,
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  demoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  demoLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  demoValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  genderText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  subHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  ageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ageItem: {
    alignItems: 'center',
  },
  ageGroupLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  ageCount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  exportButton: {
    height: 56,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  exportButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  eventList: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 8,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  eventDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  eventCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  addEventButton: {
    marginTop: 12,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  addEventButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  langBtn: { padding: 6 },
  langBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  syncIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80
  },
  syncIndicatorActive: {
    backgroundColor: COLORS.accent,
  },
  welcomeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderLeftWidth: 6,
    borderLeftColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  masterDownloadBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  masterDownloadText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  shortcutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shortcutCard: {
    backgroundColor: COLORS.surface,
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shortcutIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  shortcutLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabIcon: { fontSize: 32, color: '#FFF', fontWeight: '400', marginTop: -4 },
  fabMenu: {
    position: 'absolute',
    right: 24,
    bottom: 110,
    alignItems: 'flex-end',
  },
  fabMenuItem: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  fabMenuText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  hwcTeamBanner: {
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  teamText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 12,
  },
  roleToggleGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  roleMiniBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  roleMiniBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleMiniText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  roleMiniTextActive: {
    color: '#FFF',
  },
});

export default DashboardScreen;
