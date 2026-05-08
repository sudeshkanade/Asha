import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { useTranslation } from 'react-i18next';

const AdminDashboard = ({ user, onBack, onNavigate }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, villages: 0, pending: 0 });

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    setLoading(true);
    const allUsers = await storage.getAll(STORAGE_KEYS.USERS);
    const allVillages = await storage.getAll(STORAGE_KEYS.VILLAGES);
    
    setStats({
      users: allUsers.length,
      villages: allVillages.length,
      pending: allUsers.filter(u => u.approvalStatus === 'pending').length
    });
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('adminDashboard', 'Admin Panel')}</Text>
          <Text style={styles.headerSubtitle}>{t('districtManagement', 'District Infrastructure & Control')}</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => onNavigate('Login')}>
          <Text style={styles.profileIcon}>🚪</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <>
            <View style={styles.statGrid}>
              <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.statVal}>{stats.users}</Text>
                <Text style={styles.statLabel}>Total Workers</Text>
              </View>
              <TouchableOpacity 
                style={[styles.statCard, { backgroundColor: COLORS.error }]}
                onPress={() => onNavigate('AdminSetup', { initialTab: 'Approvals' })}
              >
                <Text style={styles.statVal}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Pending Approvals</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>{t('infrastructureManagement', 'Infrastructure Management')}</Text>
            <View style={styles.toolGrid}>
              <ToolItem 
                title={t('hierarchyMgmt')} 
                icon="🗺️" 
                desc="Map PHCs, SCs & Villages" 
                onPress={() => onNavigate('AdminSetup')}
              />
              <ToolItem 
                title={t('userManagement', 'User Management')} 
                icon="👥" 
                desc="Roles, Resets & Deletion" 
                onPress={() => onNavigate('AdminSetup', { initialTab: 'Approvals' })}
              />
              <ToolItem 
                title={t('masterData', 'Master Data')} 
                icon="⚙️" 
                desc="Medication & Rate Masters" 
                onPress={() => onNavigate('RateSettings')}
              />
              <ToolItem 
                title={t('auditLogs', 'System Audit')} 
                icon="📜" 
                desc="Action History & Sync Logs" 
                onPress={() => Alert.alert("Audit Logs", "Feature coming in Phase 3.")}
              />
            </View>

            <View style={styles.maintenanceCard}>
              <Text style={styles.maintenanceTitle}>🔧 {t('maintenance', 'System Maintenance')}</Text>
              <TouchableOpacity style={styles.maintenanceBtn} onPress={() => onNavigate('AdminSetup', { initialTab: 'Wipe' })}>
                <Text style={styles.maintenanceBtnText}>Database Tools & Wipe</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.maintenanceBtn, { marginTop: 12, backgroundColor: COLORS.secondary }]} onPress={() => Alert.alert("Export All", "Generating master backup...")}>
                <Text style={styles.maintenanceBtnText}>Export Full District Backup</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const ToolItem = ({ title, icon, desc, onPress }) => (
  <TouchableOpacity style={styles.toolCard} onPress={onPress}>
    <View style={styles.toolIconContainer}>
      <Text style={styles.toolIcon}>{icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.toolTitle}>{title}</Text>
      <Text style={styles.toolDesc}>{desc}</Text>
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: 24, backgroundColor: '#0F172A', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  profileIcon: { fontSize: 20 },
  statGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, padding: 20, borderRadius: 24, elevation: 4 },
  statVal: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  toolGrid: { gap: 12, marginBottom: 24 },
  toolCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, 
    padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  toolIconContainer: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  toolIcon: { fontSize: 24 },
  toolTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  toolDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  chevron: { fontSize: 24, color: '#CBD5E1', marginLeft: 8 },
  maintenanceCard: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 24, marginBottom: 40, borderWidth: 1, borderColor: '#E2E8F0' },
  maintenanceTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  maintenanceBtn: { backgroundColor: '#475569', padding: 16, borderRadius: 12, alignItems: 'center' },
  maintenanceBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});

export default AdminDashboard;
