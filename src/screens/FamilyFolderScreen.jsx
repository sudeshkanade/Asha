import React, { useState, useEffect, useMemo } from 'react';
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
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { useTranslation } from 'react-i18next';
import ClosedBuildingModal from '../components/ClosedBuildingModal';

const FamilyFolderScreen = ({ user, onBack, onNavigate }) => {
  const { t } = useTranslation();
  const [families, setFamilies] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [filteredFamilies, setFilteredFamilies] = useState([]);
  const [eligibleCouples, setEligibleCouples] = useState([]);
  const [filteredECs, setFilteredECs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Families'); // Families or EC
  const [selectedVillageId, setSelectedVillageId] = useState(null);
  const [showClosedModal, setShowClosedModal] = useState(false);

  const [villages, setVillages] = useState([]);

  const memoizedFilteredFamilies = useMemo(() => {
    let result = filteredFamilies.filter(f => !selectedVillageId || f.villageId === selectedVillageId);
    
    result.sort((a, b) => {
      if (a.villageId !== b.villageId) {
        return (a.villageId || '').localeCompare(b.villageId || '');
      }
      const aHouse = a.houseNo || '';
      const bHouse = b.houseNo || '';
      return aHouse.localeCompare(bHouse, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    return result;
  }, [filteredFamilies, selectedVillageId]);

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
    const assigned = user?.role === 'ASHA' ? (user.assignedVillages || []) : [];
    const assignedIds = new Set(assigned.map(v => {
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object') return v.id || v.villageId;
      return null;
    }).filter(Boolean));
    if (user?.villageId) assignedIds.add(user.villageId);

    let scopedFamilies = f;
    if (user?.role === 'ASHA') {
      scopedFamilies = f.filter(fam => assignedIds.has(fam.villageId) || !fam.villageId || fam.ashaId === user.id);
      
      // Temporary debug alert to diagnose the 0 families issue
      if (Platform.OS === 'web') {
        window.alert(`Debug: f.length=${f.length}, scopedFamilies=${scopedFamilies.length}, assignedIds=${Array.from(assignedIds).join(',')}`);
      } else {
        Alert.alert('Debug', `f.length=${f.length}, scopedFamilies=${scopedFamilies.length}, assignedIds=${Array.from(assignedIds).join(',')}`);
      }
    } else if (user?.role === 'ANM') {
      scopedFamilies = f.filter(fam => fam.subCenterId === user.subCenterId || !fam.subCenterId);
    } else if (user?.role === 'MO') {
      scopedFamilies = f.filter(fam => fam.phcId === user.phcId || !fam.phcId);
    }

    // 2. Filter Members by Hierarchy for EC List
    let scopedMembers = m;
    if (user?.role === 'ASHA') {
      scopedMembers = m.filter(mem => mem.ashaId === user.id || assignedIds.has(mem.villageId) || !mem.villageId);
    } else if (user?.role === 'ANM') {
      scopedMembers = m.filter(mem => mem.subCenterId === user.subCenterId || !mem.subCenterId);
    } else if (user?.role === 'MO') {
      scopedMembers = m.filter(mem => mem.phcId === user.phcId || !mem.phcId);
    }

    // 3. Identify Eligible Couples (Married Females 15-49) within scope
    const ecList = scopedMembers.filter(mem => {
      const age = parseInt(mem.age, 10);
      const gender = mem.gender?.toLowerCase();
      const status = mem.maritalStatus?.toLowerCase();
      const relHead = mem.relationToHead?.toLowerCase();
      const rel = mem.relation?.toLowerCase();
      
      return gender === 'female' && 
        !isNaN(age) && age >= 15 && age <= 49 &&
        (status === 'married' || relHead === 'wife' || rel === 'wife' || relHead === 'daughter-in-law' || rel === 'daughter-in-law');
    });

    setFamilies(scopedFamilies);
    setFilteredFamilies(scopedFamilies);
    setEligibleCouples(ecList);
    setFilteredECs(ecList);
    setAllMembers(m); // Keep all members for counting in family cards (the families themselves are already filtered)
    setLoading(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const q = query.toLowerCase();
    
    // Filter Families
    const filteredFam = families.filter(fam => 
      fam.houseNo?.toLowerCase().includes(q) || 
      fam.headName?.toLowerCase().includes(q) ||
      villages.find(v => v.id === fam.villageId)?.name?.toLowerCase().includes(q)
    );
    setFilteredFamilies(filteredFam);

    // Filter ECs
    const filteredEC = eligibleCouples.filter(ec => 
      ec.firstName?.toLowerCase().includes(q) ||
      ec.lastName?.toLowerCase().includes(q) ||
      ec.houseNo?.toLowerCase().includes(q)
    );
    setFilteredECs(filteredEC);
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
            style={styles.editBtn} 
            onPress={() => onNavigate('FamilyRegistration', { family: item })}
          >
            <Text style={styles.editBtnText}>✏️</Text>
          </TouchableOpacity>
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
        <View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchHouseName')}
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
          
          <View style={styles.villageSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.villageScroll}>
              <TouchableOpacity 
                style={[styles.villageChip, !selectedVillageId && styles.activeVillageChip]}
                onPress={() => setSelectedVillageId(null)}
              >
                <Text style={[styles.villageChipText, !selectedVillageId && styles.activeVillageChipText]}>{t('allVillages')}</Text>
              </TouchableOpacity>
              {villages.filter(v => {
                if (user?.role === 'ASHA') {
                  const assigned = user.assignedVillages || [];
                  const assignedIds = new Set(assigned.map(av => {
                    if (typeof av === 'string') return av;
                    if (av && typeof av === 'object') return av.id || av.villageId;
                    return null;
                  }).filter(Boolean));
                  if (user.villageId) assignedIds.add(user.villageId);
                  return assignedIds.has(v.id);
                }
                if (user?.role === 'ANM') return v.subCenterId === user.subCenterId;
                if (user?.role === 'MO') return v.phcId === user.phcId;
                return true;
              }).map(v => (
                <TouchableOpacity 
                  key={v.id}
                  style={[styles.villageChip, selectedVillageId === v.id && styles.activeVillageChip]}
                  onPress={() => setSelectedVillageId(v.id)}
                >
                  <Text style={[styles.villageChipText, selectedVillageId === v.id && styles.activeVillageChipText]}>{v.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : activeTab === 'Families' ? (
        <FlatList
          data={memoizedFilteredFamilies}
          renderItem={renderFamily}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('noFamilies')}</Text>}
        />
      ) : (
        <FlatList
          data={filteredECs}
          renderItem={renderEC}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('noEligibleCouples', 'No Eligible Couples found.')}</Text>}
        />
      )}

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: COLORS.accent }]} 
          onPress={() => setShowClosedModal(true)}
        >
          <Text style={styles.fabText}>🏠 {t('closed')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => onNavigate('FamilyRegistration')}
        >
          <Text style={styles.fabText}>➕ {t('add')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: COLORS.secondary }]} 
          onPress={() => onNavigate('MemberRegistration')}
        >
          <Text style={styles.fabText}>👤 {t('add')}</Text>
        </TouchableOpacity>
      </View>

      <ClosedBuildingModal
        visible={showClosedModal}
        villages={villages.filter(v => {
          if (user?.role === 'ASHA') {
            const assigned = user.assignedVillages || [];
            const assignedIds = new Set(assigned.map(av => typeof av === 'object' ? (av.id || av.villageId) : av).filter(Boolean));
            if (user.villageId) assignedIds.add(user.villageId);
            return assignedIds.has(v.id);
          }
          if (user?.role === 'ANM') return v.subCenterId === user.subCenterId;
          if (user?.role === 'MO') return v.phcId === user.phcId;
          return true;
        })}
        defaultVillageId={selectedVillageId || user.villageId}
        onClose={() => setShowClosedModal(false)}
        onSave={async ({ houseNo, buildingType, villageId }) => {
          await storage.save(STORAGE_KEYS.FAMILIES, {
            id: storage.generateId('closed', user?.id),
            houseNo: houseNo,
            headName: `${t('closedBuilding', 'Closed / Locked Building')} (${buildingType})`,
            isClosed: true,
            buildingType: buildingType,
            ashaId: user.id,
            villageId: villageId || user.villageId,
            subCenterId: user.subCenterId,
            phcId: user.phcId,
            lastUpdatedAt: Date.now()
          });
          Alert.alert(t('success'), t('closedBuildingAdded'));
          loadData();
        }}
      />
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
  listContent: { padding: 16, paddingBottom: 140 },
  familyCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: COLORS.secondary },
  familyInfo: { flex: 1 },
  villageName: { fontSize: 10, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  houseNo: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  headName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  memberCount: { fontSize: 12, color: COLORS.textSecondary },
  familyDetailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  dotSeparator: { color: COLORS.border, marginHorizontal: 4 },
  actions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  viewBtn: { padding: 8, backgroundColor: '#F0F4FF', borderRadius: 8 },
  viewBtnText: { fontSize: 18 },
  editBtn: { padding: 8, backgroundColor: '#F0F9FF', borderRadius: 8 },
  editBtnText: { fontSize: 18 },
  fpBadgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  deleteBtn: { padding: 8, backgroundColor: '#FFF0F0', borderRadius: 8 },
  deleteBtnText: { fontSize: 18 },
  sectionHeader: { backgroundColor: 'transparent', paddingVertical: 8, marginTop: 8 },
  sectionHeaderText: { fontSize: 13, fontWeight: '800', color: COLORS.primary, letterSpacing: 1, textTransform: 'uppercase' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textSecondary },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  fab: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  villageSelector: {
    backgroundColor: COLORS.surface,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  villageScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  villageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeVillageChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  villageChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeVillageChipText: {
    color: '#FFF',
  },
});

export default FamilyFolderScreen;
