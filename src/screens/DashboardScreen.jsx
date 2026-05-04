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

const DashboardScreen = ({ user, onNavigate }) => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = React.useState(null);
  const [exporting, setExporting] = React.useState(false);

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

  React.useEffect(() => {
    loadLiveStats();
  }, []);

  const loadLiveStats = async () => {
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    const events = await storage.getAll(STORAGE_KEYS.SYNC_QUEUE);
    
    // Optimized: Filter once based on role
    let members = allMembers;
    if (user?.role === 'ASHA') {
      members = allMembers.filter(m => m.ashaId === user.id || m.villageId === user.villageId);
    } else if (user?.role === 'ANM') {
      members = allMembers.filter(m => m.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      members = allMembers.filter(m => m.phcId === user.phcId);
    }

    setSyncCount(events.length);
    const liveStats = generateMPRStats(members, events);
    
    // Aggregated counting in one pass for performance
    let mCount = 0, fCount = 0, a0_5 = 0, a6_18 = 0, a60plus = 0;
    members.forEach(m => {
      if (m.gender === 'Male') mCount++;
      else if (m.gender === 'Female') fCount++;
      
      const age = parseInt(m.age);
      if (age <= 5) a0_5++;
      else if (age > 5 && age <= 18) a6_18++;
      else if (age >= 60) a60plus++;
    });

    const allTasks = generateAllTasks(members);
    const pendingCount = allTasks.filter(t => t.status !== 'completed').length;
    setPendingTasksCount(pendingCount);

    setStats({
      ...liveStats,
      demographics: {
        total: members.length,
        male: mCount,
        female: fCount,
        ageGroups: { '0-5': a0_5, '6-18': a6_18, '60+': a60plus }
      }
    });
    setLoading(false);
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
          <Text style={styles.headerTitle}>{user?.role === 'ASHA' ? 'आशा' : user?.role} {t('login')}</Text>
          <Text style={styles.headerSubtitle}>
            {user?.role === 'ASHA' ? `${user.village} (Ward ${user.ward || 'N/A'})` : user?.name}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            style={[styles.syncContainer, { marginRight: 10, backgroundColor: 'rgba(255,255,255,0.1)' }]} 
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
            style={[styles.syncContainer, { marginRight: 10, backgroundColor: 'rgba(255,255,255,0.1)' }]} 
            onPress={() => i18n.changeLanguage(i18n.language === 'en' ? 'mr' : 'en')}
          >
            <Text style={styles.syncText}>{i18n.language === 'en' ? 'मराठी' : 'EN'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.syncContainer} onPress={() => onNavigate('Login')}>
            <Text style={styles.syncText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeText}>{t('welcome')}, {user?.name}</Text>
            <Text style={styles.roleLabel}>{user?.role} • {user?.phcName || user?.phcId || 'Primary Health Centre'}</Text>
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

        {/* Core Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('operationalTools')}</Text>
          <View style={styles.shortcutGrid}>
            {user?.role === 'ASHA' && (
              <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('Tasks')}>
                <Text style={styles.shortcutIcon}>📋</Text>
                <Text style={styles.shortcutLabel}>{t('dueList')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('FamilyFolder')}>
              <Text style={styles.shortcutIcon}>📁</Text>
              <Text style={styles.shortcutLabel}>{t('familyRegister')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('MemberList')}>
              <Text style={styles.shortcutIcon}>👥</Text>
              <Text style={styles.shortcutLabel}>{user?.role === 'ASHA' ? t('myMembers') : t('lineListing')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('VitalEvents')}>
              <Text style={styles.shortcutIcon}>📝</Text>
              <Text style={styles.shortcutLabel}>{t('vitalEvents')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('VHND')}>
              <Text style={styles.shortcutIcon}>🏕️</Text>
              <Text style={styles.shortcutLabel}>{t('vhndSession')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate(user?.role === 'ANM' ? 'GoshwaraReport' : 'MPRReport')}>
              <Text style={styles.shortcutIcon}>📊</Text>
              <Text style={styles.shortcutLabel}>{t('reports')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('Claims')}>
              <Text style={styles.shortcutIcon}>💰</Text>
              <Text style={styles.shortcutLabel}>{t('claims')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('Team')}>
              <Text style={styles.shortcutIcon}>🤝</Text>
              <Text style={styles.shortcutLabel}>{t('myTeam')}</Text>
            </TouchableOpacity>

            {(user?.role === 'Admin' || user?.role === 'ANM') && (
              <>
                <TouchableOpacity style={[styles.shortcutCard, {backgroundColor: '#F1F5F9'}]} onPress={() => onNavigate('AdminSetup')}>
                  <Text style={styles.shortcutIcon}>⚙️</Text>
                  <Text style={styles.shortcutLabel}>{t('setupHierarchy')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.shortcutCard, {backgroundColor: '#FFF7ED'}]} onPress={() => onNavigate('RateSettings')}>
                  <Text style={styles.shortcutIcon}>💲</Text>
                  <Text style={styles.shortcutLabel}>{t('rateSettings')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Quick Action FAB */}
      {fabOpen && (
        <View style={styles.fabMenu}>
          <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabOpen(false); onNavigate('FamilyFolder'); }}>
            <Text style={styles.fabMenuText}>📝 New Family</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabOpen(false); onNavigate('VitalEvents'); }}>
            <Text style={styles.fabMenuText}>👶 Record Birth/Death</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabOpen(false); onNavigate('VHND'); }}>
            <Text style={styles.fabMenuText}>💊 Log VHND</Text>
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
  scrollContent: {
    padding: 16,
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
    bottom: 24,
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
    bottom: 90,
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
});

export default DashboardScreen;
