import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { generateMPRStats } from '../utils/reportLogic';
import { exportMasterPopulation } from '../utils/exportLogic';
import { generateAllTasks } from '../utils/healthLogic';
import { useTranslation } from 'react-i18next';
import { cloudSyncManager } from '../database/cloudSync';
import { Alert, Platform } from 'react-native';
import ClosedBuildingModal from '../components/ClosedBuildingModal';

// BUG-H1 / OPT-3: Memoized task generation cache.
// generateAllTasks is O(members * schedule_items) — expensive on 500+ member datasets.
// We cache the last result and only recompute when the member snapshot actually changes.
let _lastTaskHash = null;
let _cachedTasks = [];

const _getTaskHash = (members) => {
  if (!members || members.length === 0) return '0';
  // Lightweight hash: count + first record timestamp + last record timestamp
  return `${members.length}_${members[0]?.lastUpdatedAt || 0}_${members[members.length - 1]?.lastUpdatedAt || 0}`;
};

const getMemoizedTasks = (members) => {
  const hash = _getTaskHash(members);
  if (hash === _lastTaskHash) return _cachedTasks;
  _lastTaskHash = hash;
  _cachedTasks = generateAllTasks(members);
  return _cachedTasks;
};

const DashboardScreen = ({ user, onNavigate }) => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = React.useState(null);
  const [exporting, setExporting] = React.useState(false);
  const [hwcRole, setHwcRole] = React.useState(user?.role || 'ANM'); // Internal role toggle

  const [villages, setVillages] = React.useState([]);
  const [stockOrs, setStockOrs] = React.useState(100);
  const [stockIfa, setStockIfa] = React.useState(500);
  const [stockLoaded, setStockLoaded] = React.useState(false);
  const [showClosedModal, setShowClosedModal] = React.useState(false);
  const [showSpecialRegisters, setShowSpecialRegisters] = React.useState(false);

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
    loadStockLevels(); // BUG-STOCK-01 FIX: hydrate stock widget from persistent storage
    // Auto-sync on launch
    cloudSyncManager.startBackgroundSync();
  }, []);

  // BUG-STOCK-01 FIX: Load persisted stock levels from storage on mount
  const loadStockLevels = async () => {
    try {
      const stockItems = await storage.getAll(STORAGE_KEYS.STOCK);
      const ors = stockItems.find(s => s.id === 'quick_stock_ors');
      const ifa = stockItems.find(s => s.id === 'quick_stock_ifa');
      if (ors) setStockOrs(ors.quantity ?? 100);
      if (ifa) setStockIfa(ifa.quantity ?? 500);
      setStockLoaded(true);
    } catch (e) {
      setStockLoaded(true); // fall back to defaults silently
    }
  };

  const handleAddClosedBuilding = () => {
    setShowClosedModal(true);
  };

  const finalizeClosedBuilding = async ({ houseNo, buildingType, villageId }) => {
    const closedFamily = {
      id: storage.generateId('closed', user?.id),
      houseNo: houseNo,
      headName: `${t('closedBuilding', 'Closed / Locked Building')} (${buildingType})`,
      isClosed: true,
      buildingType: buildingType,
      ashaId: user.id,
      villageId: villageId || user.villageId,
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
    // BUG-M1 FIX: Use STORAGE_KEYS.PHC_SUMMARY constant instead of raw magic string
      const summaryStr = await storage.getRaw(STORAGE_KEYS.PHC_SUMMARY);
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

      // Determine local villages list for ASHA
      let localVillages = [];
      if (user?.role === 'ASHA') {
        const assigned = user.assignedVillages || [];
        localVillages = assigned.map(v => {
          if (typeof v === 'string') {
            return { id: v, name: v === user.villageId ? (user.village || v) : v };
          } else if (v && typeof v === 'object') {
            return {
              id: v.id || v.villageId || v.value || '',
              name: v.name || v.villageName || v.label || v.id || ''
            };
          }
          return null;
        }).filter(v => v && v.id);

        if (localVillages.length === 0 && user.villageId) {
          localVillages.push({ id: user.villageId, name: user.village || 'My Village' });
        }
      }

      // BACKGROUND: Perform deep scan only if necessary or on a throttle
      // OPTIMIZATION: Fetch storage tables in parallel to prevent blocking calls
      const [allMembers, vEvents, vhndSessions, events, allVillages] = await Promise.all([
        storage.getAll(STORAGE_KEYS.MEMBERS),
        storage.getAll(STORAGE_KEYS.VITAL_EVENTS),
        storage.getAll(STORAGE_KEYS.VHND_SESSIONS),
        storage.getAll(STORAGE_KEYS.SYNC_QUEUE),
        user?.role === 'ASHA' ? Promise.resolve([]) : storage.getAll(STORAGE_KEYS.VILLAGES)
      ]);

      let finalVillages = user?.role === 'ASHA' ? localVillages : allVillages;
      if (user?.role === 'ANM') {
        finalVillages = allVillages.filter(v => v.subCenterId === user.subCenterId);
      } else if (user?.role === 'MO') {
        finalVillages = allVillages.filter(v => v.phcId === user.phcId);
      }
      setVillages(finalVillages);

      const assignedIds = new Set(finalVillages.map(v => v.id));
      
      let members = allMembers;
      if (user?.role === 'ASHA') {
        members = allMembers.filter(m => !m.villageId || m.ashaId === user.id || assignedIds.has(m.villageId));
      } else if (user?.role === 'ANM') {
        members = allMembers.filter(m => m.subCenterId === user.subCenterId);
      } else if (user?.role === 'MO') {
        members = allMembers.filter(m => m.phcId === user.phcId);
      }

      setSyncCount(events.length);
      
      // BUG-H1 / OPT-3 FIX: Use memoized task generation.
      // generateAllTasks is CPU-heavy (O(n * schedule_items)). We skip recompute
      // when the member snapshot hash matches the previous call.
      const generatedTasks = getMemoizedTasks(members);
      const pendingCount = generatedTasks.filter(t => t.status === 'pending').length;
      const criticalCount = generatedTasks.filter(t => t.isEmergency && t.status === 'pending').length;
      
      const liveStats = generateMPRStats(members, vEvents, vhndSessions, events);

      setPendingTasksCount(pendingCount);
      setStats(prev => ({
        ...prev,
        ...liveStats,
        criticalCount,
        maternal: {
          ...prev?.maternal,
          ...liveStats?.maternal
        },
        demographics: {
          ...prev?.demographics,
          ...liveStats?.demographics,
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
      // 1. Recover any dropped data from the queue
      await cloudSyncManager.recoverUnsyncedData();

      // 2. Push local changes to cloud
      const pushResult = await cloudSyncManager.startBackgroundSync();
      
      // 3. Pull latest data from cloud
      const pullResult = await cloudSyncManager.pullFromCloud(user);

      if (pushResult.success || pullResult.success) {
        await loadLiveStats();
        const msg = t('syncCompleteMsg') + (pushResult.syncedCount || 0) + ', ' + t('pulled') + ': ' + (pullResult.pulledCount || 0);
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert(t('syncResult'), msg);
      } else {
        const errorMsg = pushResult.message || pullResult.message || t('checkConnection');
        if (Platform.OS === 'web') window.alert(t('syncFailed') + ': ' + errorMsg);
        else Alert.alert(t('syncFailed'), errorMsg);
      }
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') window.alert(t('syncError'));
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
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{user?.role === 'ASHA' ? t('asha') : user?.role} {t('dashboard', 'Dashboard')}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {user?.role === 'ASHA' ? `${user.village} (${t('ward')} ${user.ward || t('na')})` : user?.name}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
              // UI-11 FIX: Wrap in try/finally so isSyncing is always reset
              // even if loadLiveStats() or pullFromCloud() throws an error.
              setIsSyncing(true);
              try {
                await loadLiveStats();
                await cloudSyncManager.pullFromCloud(user, true); // force=true: bypass cooldown on manual refresh
                if (Platform.OS === 'web') window.alert(t('pageRefreshed'));
              } catch (e) {
                console.error('Manual refresh failed:', e);
              } finally {
                setIsSyncing(false);
              }
            }}
          >
            <Text style={styles.syncText}>↻</Text>
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

      {stats?.criticalCount > 0 && (
        <TouchableOpacity
          style={{ backgroundColor: '#FEF2F2', borderLeftWidth: 4,
            borderLeftColor: '#EF4444', padding: 12, margin: 12, borderRadius: 8, elevation: 1 }}
          onPress={() => onNavigate('MemberList', { filterType: 'HIGH_RISK_ANC' })}
        >
          <Text style={{ color: '#DC2626', fontWeight: '800', fontSize: 14 }}>
            🚨 {stats.criticalCount} {stats.criticalCount > 1 ? t('criticalCasesAlert', 'Critical Cases Need Immediate Attention') : t('criticalCaseAlert', 'Critical Case Needs Immediate Attention')}
          </Text>
        </TouchableOpacity>
      )}

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
          <View style={[styles.statsRow, { marginTop: 12 }]}>
            <StatCard 
              label={t('highRiskPreg')} 
              value={stats.maternal?.activeHighRisk || 0} 
              color={COLORS.error}
              onPress={() => onNavigate('MemberList', { filterType: 'HIGH_RISK_ANC' })}
            />
            <StatCard 
              label={t('samChildren')} 
              value={stats.child?.samChildren || 0} 
              color={COLORS.error}
              onPress={() => onNavigate('MemberList', { filterType: 'SAM_CHILDREN' })}
            />
          </View>
        </View>

        {/* Smart Directory Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('smartDirectory', 'Member Directory')}</Text>
          <View style={styles.shortcutGrid}>
            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('MemberList')}>
              <Text style={styles.shortcutIcon}>👥</Text>
              <Text style={styles.shortcutLabel}>{t('allMembers', 'All Members')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('FamilyFolder')}>
              <Text style={styles.shortcutIcon}>📁</Text>
              <Text style={styles.shortcutLabel}>{t('familyFolders', 'Family Folders')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shortcutCard, { backgroundColor: '#F0F9FF' }]} onPress={() => onNavigate('VitalEvents')}>
              <Text style={styles.shortcutIcon}>📝</Text>
              <Text style={styles.shortcutLabel}>{t('vitalEvents')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shortcutCard, { backgroundColor: '#FFFBEB' }]} onPress={() => setShowSpecialRegisters(true)}>
              <Text style={styles.shortcutIcon}>📋</Text>
              <Text style={styles.shortcutLabel}>{t('specialRegisters', 'Special Registers')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Operational & Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('toolsAndReports', 'Tools & Reports')}</Text>
          <View style={styles.shortcutGrid}>
            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate(user?.role === 'ANM' ? 'GoshwaraReport' : 'MPRReport')}>
              <Text style={styles.shortcutIcon}>📊</Text>
              <Text style={styles.shortcutLabel}>{t('reports')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('VHND')}>
              <Text style={styles.shortcutIcon}>🏕️</Text>
              <Text style={styles.shortcutLabel}>{t('vhndSession')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shortcutCard, { backgroundColor: '#F0FDF4' }]} onPress={() => onNavigate('Workplan')}>
              <Text style={styles.shortcutIcon}>📅</Text>
              <Text style={styles.shortcutLabel}>{t('workplan')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shortcutCard, { backgroundColor: '#F1F5F9' }]} onPress={() => onNavigate('AdminSetup')}>
              <Text style={styles.shortcutIcon}>⚙️</Text>
              <Text style={styles.shortcutLabel}>{t('moreTools', 'More Tools')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Quick Action FAB */}
      {fabOpen && (
        <View style={styles.fabMenu}>
          <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabOpen(false); handleAddClosedBuilding(); }}>
            <Text style={styles.fabMenuText}>🏠 {t('addClosedBuilding')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabOpen(false); onNavigate('FamilyRegistration'); }}>
            <Text style={styles.fabMenuText}>📝 {t('newFamily')}</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setFabOpen(!fabOpen)}
      >
        <Text style={styles.fabIcon}>{fabOpen ? '×' : '+'}</Text>
      </TouchableOpacity>

      {/* Special Registers Modal */}
      <Modal visible={showSpecialRegisters} animationType="slide" transparent={true} onRequestClose={() => setShowSpecialRegisters(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center'}}>
              <Text style={styles.modalTitle}>{t('specialRegisters', 'Special Registers')}</Text>
              <TouchableOpacity onPress={() => setShowSpecialRegisters(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {[
                { label: 'High Risk Pregnancies', filter: 'HIGH_RISK_ANC', icon: '🚨' },
                { label: 'New ANC', filter: 'NEW_ANC', icon: '🤰' },
                { label: 'PNC Cases', filter: 'PNC_CASES', icon: '👶' },
                { label: 'Eligible Couples', filter: 'ELIGIBLE_COUPLE', icon: '💍' },
                { label: 'SAM/MAM Children', filter: 'SAM_CHILDREN', icon: '⚖️' },
                { label: 'NCD Screening', filter: 'NCD_SCREENING', icon: '🩺' },
                { label: 'PwD', filter: 'PWD', icon: '♿' },
                { label: 'BPL Families', filter: 'BPL', icon: '💳' },
              ].map(item => (
                <TouchableOpacity 
                  key={item.filter}
                  style={styles.registerItem}
                  onPress={() => {
                    setShowSpecialRegisters(false);
                    onNavigate('MemberList', { filterType: item.filter });
                  }}
                >
                  <Text style={styles.registerIcon}>{item.icon}</Text>
                  <Text style={styles.registerLabel}>{item.label}</Text>
                  <Text style={{ fontSize: 24, color: COLORS.border, fontWeight: '300' }}>›</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ClosedBuildingModal
        visible={showClosedModal}
        villages={villages}
        defaultVillageId={villages.length > 0 ? villages[0].id : null}
        onClose={() => setShowClosedModal(false)}
        onSave={finalizeClosedBuilding}
      />
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
    width: '47%',
    flexGrow: 1,
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
    width: '47%',
    flexGrow: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
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
  widgetCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12,
  },
  widgetInput: {
    height: 40,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  widgetPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  widgetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFF',
  },
  widgetChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  widgetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  widgetChipTextActive: {
    color: '#FFF',
  },
  widgetBtn: {
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  widgetBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stockItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stockItemLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  stockBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stockBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    elevation: 1,
  },
  quickActionBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9FF',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  quickActionLabelTextActive: {
    color: COLORS.primary,
  },
  widgetSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeButtonText: { fontSize: 24, color: '#64748B' },
  registerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  registerIcon: { fontSize: 24, marginRight: 16 },
  registerLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.text },
});

export default DashboardScreen;
