import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { useTranslation } from 'react-i18next';

const FamilyFolderScreen = ({ user, onBack, onNavigate }) => {
  const { t } = useTranslation();
  const [families, setFamilies] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [filteredFamilies, setFilteredFamilies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Families'); // Families or EC
  const [eligibleCouples, setEligibleCouples] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const f = await storage.getAll(STORAGE_KEYS.FAMILIES);
    const m = await storage.getAll(STORAGE_KEYS.MEMBERS);
    
    // Hierarchy filtering
    let scopedFamilies = f;
    if (user?.role === 'ASHA') {
      scopedFamilies = f.filter(fam => fam.villageId === user.villageId);
    }

    // Identify Eligible Couples (Married Females 15-49)
    const ecList = m.filter(mem => 
      mem.gender === 'Female' && 
      parseInt(mem.age) >= 15 && 
      parseInt(mem.age) <= 49 &&
      (mem.villageId === user.villageId) &&
      (mem.maritalStatus === 'Married' || mem.relationToHead === 'Wife' || mem.relation === 'Wife' || mem.relationToHead === 'Daughter-in-law' || mem.relation === 'Daughter-in-law')
    );

    setFamilies(scopedFamilies);
    setFilteredFamilies(scopedFamilies);
    setEligibleCouples(ecList);
    setAllMembers(m);
    setLoading(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const q = query.toLowerCase();
    const filtered = families.filter(fam => 
      fam.houseNo?.toLowerCase().includes(q) || 
      fam.headName?.toLowerCase().includes(q)
    );
    setFilteredFamilies(filtered);
  };

  const handleDeleteFamily = (familyId) => {
    Alert.alert(
      t('delete'),
      'Are you sure? This will delete the entire family folder and all its members.',
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
            const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
            
            const updatedFamilies = allFamilies.filter(f => f.id !== familyId);
            const updatedMembers = allMembers.filter(m => m.familyId !== familyId);
            
            await storage.saveAll(STORAGE_KEYS.FAMILIES, updatedFamilies);
            await storage.saveAll(STORAGE_KEYS.MEMBERS, updatedMembers);
            
            loadData(); // Full refresh
          }
        }
      ]
    );
  };

  const renderFamily = ({ item }) => {
    const members = allMembers.filter(m => m.familyId === item.id);
    return (
      <View style={styles.familyCard}>
        <View style={styles.familyInfo}>
          <Text style={styles.houseNo}>{t('houseNo')}: {item.houseNo}</Text>
          <Text style={styles.headName}>{item.headName || t('folder')}</Text>
          <Text style={styles.memberCount}>{members.length} {t('myMembers')}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.viewBtn} 
            onPress={() => onNavigate('MemberList', { filter: null, familyId: item.id })}
          >
            <Text style={styles.viewBtnText}>👁️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteBtn}
            onPress={() => handleDeleteFamily(item.id)}
          >
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEC = ({ item }) => {
    const fpMethod = item.healthData?.fpMethod || 'none';
    return (
      <View style={styles.familyCard}>
        <View style={styles.familyInfo}>
          <Text style={styles.houseNo}>{t('houseNo')}: {item.houseNo}</Text>
          <Text style={styles.headName}>{item.firstName} {item.lastName}</Text>
          <View style={styles.fpBadgeRow}>
            <Text style={styles.memberCount}>{t('fpMethod')}: </Text>
            <View style={[styles.badge, { backgroundColor: fpMethod === 'none' ? '#FEE2E2' : '#DCFCE7' }]}>
              <Text style={[styles.badgeText, { color: fpMethod === 'none' ? '#B91C1C' : '#15803D' }]}>
                {t(fpMethod)}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.viewBtn} 
          onPress={() => onNavigate('HealthTracker', { member: item })}
        >
          <Text style={styles.viewBtnText}>🩺</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('familyRegister')}</Text>
          <Text style={styles.headerSubtitle}>{families.length} {t('registeredFolders')}</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerActionBtn} 
          onPress={() => onNavigate('FamilyRegistration')}
        >
          <Text style={styles.headerActionText}>➕ {t('add')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Families' && styles.activeTab]}
          onPress={() => setActiveTab('Families')}
        >
          <Text style={[styles.tabText, activeTab === 'Families' && styles.activeTabText]}>{t('folder')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'EC' && styles.activeTab]}
          onPress={() => setActiveTab('EC')}
        >
          <Text style={[styles.tabText, activeTab === 'EC' && styles.activeTabText]}>{t('eligibleCouples')}</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'Families' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchHouseName')}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'Families' ? filteredFamilies : eligibleCouples}
          renderItem={activeTab === 'Families' ? renderFamily : renderEC}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>{activeTab === 'Families' ? t('viewList') : t('registeredEC')}</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, backgroundColor: COLORS.surface, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 10, marginRight: 10 },
  backBtnText: { fontSize: 24, color: COLORS.primary, fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  headerSubtitle: { fontSize: 12, color: COLORS.textSecondary },
  headerActionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  searchContainer: { padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchInput: { height: 44, backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 16, fontSize: 14, color: COLORS.text },
  listContent: { padding: 16 },
  familyCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 2 },
  familyInfo: { flex: 1 },
  houseNo: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  headName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  memberCount: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  viewBtn: { padding: 8, backgroundColor: '#F0F4FF', borderRadius: 8 },
  viewBtnText: { fontSize: 18 },
  fpBadgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  deleteBtn: { padding: 8, backgroundColor: '#FFF0F0', borderRadius: 8 },
  deleteBtnText: { fontSize: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textSecondary },
});

export default FamilyFolderScreen;
