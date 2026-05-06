import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { useTranslation } from 'react-i18next';

const MemberListScreen = ({ user, filterType, familyId, onMemberSelect, onNavigate, onBack }) => {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMembers();
  }, [filterType]);

  const loadMembers = async () => {
    setLoading(true);
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    
    // Hierarchy filtering
    let scopedMembers = allMembers;
    if (user?.role === 'ASHA') {
      scopedMembers = allMembers.filter(m => m.ashaId === user.id || m.villageId === user.villageId);
    } else if (user?.role === 'ANM') {
      scopedMembers = allMembers.filter(m => m.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      scopedMembers = allMembers.filter(m => m.phcId === user.phcId);
    }

    let filtered = scopedMembers;
    if (familyId) {
      filtered = scopedMembers.filter(m => m.familyId === familyId);
    } else if (filterType === 'high_risk') {
      filtered = scopedMembers.filter(m => m.healthData?.isHighRisk);
    } else if (filterType === 'anemia') {
      filtered = scopedMembers.filter(m => parseFloat(m.healthData?.hbLevel) < 7);
    } else if (filterType === 'sam') {
      filtered = scopedMembers.filter(m => parseInt(m.age) <= 5 && m.healthData?.weight && parseFloat(m.healthData.weight) < 10);
    } else if (filterType === 'eligible_couple') {
      filtered = scopedMembers.filter(mem => 
        mem.gender === 'Female' && 
        parseInt(mem.age) >= 15 && 
        parseInt(mem.age) <= 49 &&
        (mem.maritalStatus === 'Married' || mem.relationToHead === 'Wife' || mem.relation === 'Wife' || mem.relationToHead === 'Daughter-in-law' || mem.relation === 'Daughter-in-law')
      );
    }

    setMembers(filtered);
    setFilteredMembers(filtered);
    setLoading(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredMembers(members);
      return;
    }
    const q = query.toLowerCase();
    const results = members.filter(m => 
      m.firstName?.toLowerCase().includes(q) || 
      m.lastName?.toLowerCase().includes(q) ||
      m.houseNo?.toLowerCase().includes(q)
    );
    setFilteredMembers(results);
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case 'high_risk': return t('highRiskPreg');
      case 'anemia': return t('severeAnemiaHb');
      case 'sam': return t('samChildren');
      case 'eligible_couple': return t('eligibleCouples');
      default: return t('villageMembers', 'Village Members');
    }
  };

  const handleDeleteMember = (memberId, name) => {
    const displayName = name.trim() === 'undefined undefined' ? 'Unnamed Member' : name;
    
    const confirmDelete = async () => {
      const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
      // Remove locally (fallback to matching object if id is missing, though rare)
      const updatedMembers = allMembers.filter(m => m.id !== memberId);
      await storage.saveAll(STORAGE_KEYS.MEMBERS, updatedMembers);
      
      // Queue cloud deletion
      if (memberId) {
        await storage.addToDeleteQueue(STORAGE_KEYS.MEMBERS, memberId);
      }
      
      loadMembers(); // Refresh with current filters
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${t('delete')} ${displayName}?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        t('delete'),
        `${t('delete')} ${name}?`,
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

  const renderMember = ({ item }) => (
    <View style={styles.memberCard}>
      <TouchableOpacity 
        style={styles.memberInfo}
        onPress={() => onMemberSelect(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.memberName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.memberSubText}>
          {item.gender} • {t('age')}: {item.age} • {t('house') || 'House'}: {item.houseNo || t('na')}
        </Text>
      </TouchableOpacity>
      <View style={styles.badgeContainer}>
        {item.healthData?.isPregnant && item.healthData?.isHighRisk && (
          <View style={[styles.badge, { backgroundColor: '#FEE2E2', borderColor: COLORS.error, borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color: COLORS.error }]}>🔴 {t('hrp', 'HRP')}</Text>
          </View>
        )}
        {item.healthData?.hbLevel && parseFloat(item.healthData.hbLevel) < 7 && (
          <View style={[styles.badge, { backgroundColor: '#FFEDD5', borderColor: '#EA580C', borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color: '#EA580C' }]}>🟠 {t('anemia', 'ANEMIA')}</Text>
          </View>
        )}
        {item.healthData?.hasNcd && (
          <View style={[styles.badge, { backgroundColor: '#FEF9C3', borderColor: '#CA8A04', borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color: '#CA8A04' }]}>🟡 {t('ncd', 'NCD')}</Text>
          </View>
        )}
        {parseInt(item.age) <= 5 && item.healthData?.weight && (parseFloat(item.healthData.weight) < 10) && (
          <View style={[styles.badge, { backgroundColor: '#FEE2E2', borderColor: COLORS.error, borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color: COLORS.error }]}>🔴 {t('sam', 'SAM')}</Text>
          </View>
        )}
        {item.status === 'Deceased' && (
          <View style={[styles.badge, { backgroundColor: '#475569', borderColor: '#334155', borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color: '#FFF' }]}>{t('deceased', 'DECEASED')}</Text>
          </View>
        )}
        {item.isMigrant && (
          <View style={[styles.badge, { backgroundColor: '#E0E7FF', borderColor: '#4F46E5', borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color: '#4F46E5' }]}>{t('migrant', 'MIGRANT')}</Text>
          </View>
        )}
        {item.isPwd && (
          <View style={[styles.badge, { backgroundColor: '#F3E8FF', borderColor: '#9333EA', borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color: '#9333EA' }]}>{t('pwd', 'PwD')}</Text>
          </View>
        )}
      </View>
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
        style={styles.deleteBtn}
        onPress={() => handleDeleteMember(item.id, `${item.firstName} ${item.lastName}`)}
      >
        <Text style={styles.deleteBtnText}>🗑️</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onMemberSelect(item)}>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{getFilterLabel()}</Text>
          <Text style={styles.headerSubtitle}>{filteredMembers.length} {t('myMembers')}</Text>
        </View>
        {familyId && (
          <TouchableOpacity 
            style={styles.addMemberBtn} 
            onPress={async () => {
              const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
              const currentFamily = allFamilies.find(f => f.id === familyId);
              onNavigate('MemberRegistration', { family: currentFamily });
            }}
          >
            <Text style={styles.addMemberBtnText}>+ {t('addMember', 'Add Member')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchHouseName')}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          renderItem={renderMember}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('noMembersFound', 'No patients found for this category.')}</Text>
            </View>
          }
        />
      )}

      {familyId && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={async () => {
            const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
            const currentFamily = allFamilies.find(f => f.id === familyId);
            onNavigate('MemberRegistration', { family: currentFamily });
          }}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 10,
    marginRight: 10,
  },
  backBtnText: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.text,
  },
  listContent: {
    padding: 16,
  },
  memberCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  memberSubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  arrow: {
    fontSize: 24,
    color: COLORS.border,
    fontWeight: '300',
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    marginRight: 8,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  editBtn: {
    padding: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    marginRight: 8,
  },
  editBtnText: {
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  addMemberBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addMemberBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabText: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: '400',
    lineHeight: 34,
  },
});

export default MemberListScreen;
