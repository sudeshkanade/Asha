import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform
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

  const [villages, setVillages] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const f = await storage.getAll(STORAGE_KEYS.FAMILIES);
    const m = await storage.getAll(STORAGE_KEYS.MEMBERS);
    const v = await storage.getAll(STORAGE_KEYS.VILLAGES);
    setVillages(v);
    
    // 1. Filter Families by Hierarchy
    let scopedFamilies = f;
    if (user?.role === 'ASHA') {
      scopedFamilies = f.filter(fam => fam.villageId === user.villageId);
    } else if (user?.role === 'ANM') {
      scopedFamilies = f.filter(fam => fam.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      scopedFamilies = f.filter(fam => fam.phcId === user.phcId);
    }

    // 2. Filter Members by Hierarchy for EC List
    let scopedMembers = m;
    if (user?.role === 'ASHA') {
      scopedMembers = m.filter(mem => mem.ashaId === user.id || mem.villageId === user.villageId);
    } else if (user?.role === 'ANM') {
      scopedMembers = m.filter(mem => mem.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      scopedMembers = m.filter(mem => mem.phcId === user.phcId);
    }

    // 3. Identify Eligible Couples (Married Females 15-49) within scope
    const ecList = scopedMembers.filter(mem => 
      mem.gender === 'Female' && 
      parseInt(mem.age) >= 15 && 
      parseInt(mem.age) <= 49 &&
      (mem.maritalStatus === 'Married' || mem.relationToHead === 'Wife' || mem.relation === 'Wife' || mem.relationToHead === 'Daughter-in-law' || mem.relation === 'Daughter-in-law')
    );

    setFamilies(scopedFamilies);
    setFilteredFamilies(scopedFamilies);
    setEligibleCouples(ecList);
    setAllMembers(m); // Keep all members for counting in family cards (the families themselves are already filtered)
    setLoading(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const q = query.toLowerCase();
    const filtered = families.filter(fam => 
      fam.houseNo?.toLowerCase().includes(q) || 
      fam.headName?.toLowerCase().includes(q) ||
      villages.find(v => v.id === fam.villageId)?.name.toLowerCase().includes(q)
    );
    setFilteredFamilies(filtered);
  };

  const handleDeleteFamily = (familyId) => {
    const confirmDelete = async () => {
      const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
      const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
      
      const updatedFamilies = allFamilies.filter(f => f.id !== familyId);
      const updatedMembers = allMembers.filter(m => m.familyId !== familyId);
      
      await storage.saveAll(STORAGE_KEYS.FAMILIES, updatedFamilies);
      await storage.saveAll(STORAGE_KEYS.MEMBERS, updatedMembers);
      
      // Queue cloud deletions
      await storage.addToDeleteQueue(STORAGE_KEYS.FAMILIES, familyId);
      const deletedMembers = allMembers.filter(m => m.familyId === familyId);
      for (const m of deletedMembers) {
        await storage.addToDeleteQueue(STORAGE_KEYS.MEMBERS, m.id);
      }
      
      loadData(); // Full refresh
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('deleteFamilyConfirm', 'Are you sure? This will delete the entire family folder and all its members.'))) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        t('delete'),
        t('deleteFamilyConfirm', 'Are you sure? This will delete the entire family folder and all its members.'),
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: t('delete'), 
            style: 'destructive',
            onPress: confirmDelete
          }
        ]
      );
    }
  };

  const renderFamily = ({ item }) => {
    const members = allMembers.filter(m => m.familyId === item.id);
    const village = villages.find(v => v.id === item.villageId);
    return (
      <View style={styles.familyCard}>
        <View style={styles.familyInfo}>
          <Text style={styles.villageName}>{village?.name || t('village')}</Text>
          <Text style={styles.headName}>{item.headName || t('folder')}</Text>
          <View style={styles.familyDetailsRow}>
            <Text style={styles.houseNo}>{t('houseNo')}: {item.houseNo}</Text>
            <Text style={styles.dotSeparator}> • </Text>
            <Text style={styles.memberCount}>{members.length} {t('myMembers')}</Text>
          </View>
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
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={async () => {
              const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
              const currentFamily = allFamilies.find(f => f.id === item.familyId);
              onNavigate('MemberRegistration', { member: item, family: currentFamily });
            }}
          >
            <Text style={styles.editBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.viewBtn} 
            onPress={() => onNavigate('HealthTracker', { member: item })}
          >
            <Text style={styles.viewBtnText}>🩺</Text>
          </TouchableOpacity>
        </View>
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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            style={[styles.headerActionBtn, { backgroundColor: COLORS.accent }]} 
            onPress={() => {
              const houseNo = window.prompt(t('enterHouseNo'));
              if (houseNo) {
                storage.save(STORAGE_KEYS.FAMILIES, {
                  id: 'closed-' + Date.now(),
                  houseNo: houseNo,
                  headName: 'Closed / Locked Building',
                  isClosed: true,
                  ashaId: user.id,
                  villageId: user.villageId,
                  subCenterId: user.subCenterId,
                  phcId: user.phcId,
                  lastUpdatedAt: Date.now()
                }).then(() => {
                  Alert.alert(t('success'), t('closedBuildingAdded'));
                  loadData();
                });
              }
            }}
          >
            <Text style={styles.headerActionText}>🏠 {t('closed')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionBtn} 
            onPress={() => onNavigate('FamilyRegistration')}
          >
            <Text style={styles.headerActionText}>➕ {t('add')}</Text>
          </TouchableOpacity>
        </View>
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
      ) : activeTab === 'Families' ? (
        <SectionList
          sections={(() => {
            if (user?.role === 'ASHA') {
              return [{ title: user.village || t('village'), data: filteredFamilies }];
            }
            // Group by village
            const grouped = filteredFamilies.reduce((acc, fam) => {
              const vName = villages.find(v => v.id === fam.villageId)?.name || t('unknownVillage');
              if (!acc[vName]) acc[vName] = [];
              acc[vName].push(fam);
              return acc;
            }, {});
            return Object.keys(grouped).sort().map(vName => ({
              title: vName,
              data: grouped[vName]
            }));
          })()}
          renderItem={renderFamily}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('viewList')}</Text>}
        />
      ) : (
        <FlatList
          data={eligibleCouples}
          renderItem={renderEC}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('registeredEC')}</Text>}
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
  familyCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: COLORS.secondary },
  familyInfo: { flex: 1 },
  villageName: { fontSize: 10, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  houseNo: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  headName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  memberCount: { fontSize: 12, color: COLORS.textSecondary },
  familyDetailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dotSeparator: { color: COLORS.border, marginHorizontal: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  viewBtn: { padding: 8, backgroundColor: '#F0F4FF', borderRadius: 8 },
  viewBtnText: { fontSize: 18 },
  editBtn: { padding: 8, backgroundColor: '#F0F9FF', borderRadius: 8 },
  editBtnText: { fontSize: 18 },
  fpBadgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  deleteBtn: { padding: 8, backgroundColor: '#FFF0F0', borderRadius: 8 },
  deleteBtnText: { fontSize: 18 },
  sectionHeader: { backgroundColor: 'transparent', paddingVertical: 8, marginTop: 8 },
  sectionHeaderText: { fontSize: 13, fontWeight: '800', color: COLORS.primary, letterSpacing: 1, textTransform: 'uppercase' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textSecondary },
});

export default FamilyFolderScreen;
