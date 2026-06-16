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
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [quickVitals, setQuickVitals] = useState({ weight: '', bp: '', hb: '' });

  useEffect(() => {
    loadMembers();
  }, [filterType]);

  const loadMembers = async () => {
    setLoading(true);
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    
    // Hierarchy filtering
    let scopedMembers = allMembers;
    if (user?.role === 'ASHA') {
      const assigned = user.assignedVillages || [];
      const assignedIds = new Set(assigned.map(v => {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object') return v.id || v.villageId;
        return null;
      }).filter(Boolean));
      if (user.villageId) assignedIds.add(user.villageId);

      scopedMembers = allMembers.filter(m => !m.villageId || m.ashaId === user.id || assignedIds.has(m.villageId));
    } else if (user?.role === 'ANM') {
      scopedMembers = allMembers.filter(m => m.subCenterId === user.subCenterId || !m.subCenterId);
    } else if (user?.role === 'MO') {
      scopedMembers = allMembers.filter(m => m.phcId === user.phcId || !m.phcId);
    }

    let filtered = scopedMembers;
    if (familyId) {
      filtered = scopedMembers.filter(m => m.familyId === familyId);
    } else {
      const type = filterType?.toLowerCase();
      if (type === 'high_risk' || type === 'high_risk_anc') {
        filtered = scopedMembers.filter(m => m.healthData?.isHighRisk);
      } else if (type === 'anemia' || type === 'severe_anemia') {
        // LOGIC-6 FIX: parseFloat('0') < 7 = true. Guard against hbLevel=0 (unset default)
        // to avoid false-positive anemia results for members with no Hb recorded.
        filtered = scopedMembers.filter(m => {
          const hb = parseFloat(m.healthData?.hbLevel);
          return hb > 0 && hb < 7;
        });
      } else if (type === 'sam' || type === 'sam_children') {
        // BUG-08 FIX: Standardize SAM to MUAC<11.5 (primary) with malnutritionStatus fallback
        filtered = scopedMembers.filter(m => {
          const muac = parseFloat(m.healthData?.muac);
          if (!isNaN(muac) && muac > 0) return muac < 11.5;
          return m.healthData?.malnutritionStatus === 'SAM' || m.healthData?.malnutritionStatus === 'high_risk';
        });
      } else if (type === 'eligible_couple') {
        filtered = scopedMembers.filter(mem => 
          mem.gender === 'Female' && 
          parseInt(mem.age) >= 15 && 
          parseInt(mem.age) <= 49 &&
          (mem.maritalStatus === 'Married' || mem.relationToHead === 'Wife' || mem.relation === 'Wife' || mem.relationToHead === 'Daughter-in-law' || mem.relation === 'Daughter-in-law')
        );
      } else if (type === 'pnc_cases' || type === 'pnc') {
        filtered = scopedMembers.filter(m => 
          m.healthData?.pncStatus === 'Pending' || 
          m.healthData?.pncStatus === 'active' || 
          (m.healthData?.lastDeliveryDate && (new Date() - new Date(m.healthData.lastDeliveryDate)) / (1000 * 60 * 60 * 24) <= 42)
        );
      } else if (type === 'new_anc') {
        filtered = scopedMembers.filter(m => 
          m.healthData?.isPregnant || 
          m.healthData?.edd || 
          m.healthData?.ancStatus === 'active' || 
          m.healthData?.ancStatus === 'registered'
        );
      } else if (type === 'pwd') {
        filtered = scopedMembers.filter(m => m.isPwd);
      } else if (type === 'bpl_families' || type === 'bpl') {
        const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
        const bplFamilyIds = new Set(allFamilies.filter(f => f.isBPL).map(f => f.id));
        filtered = scopedMembers.filter(m => bplFamilyIds.has(m.familyId));
      } else if (type === 'ncd' || type === 'ncd_screening') {
        // BUG-05 FIX: 'NCD' filter was missing — DashboardScreen navigates with filterType:'NCD'
        filtered = scopedMembers.filter(m =>
          parseInt(m.age) >= 30 &&
          (m.healthData?.bpSystolic || m.healthData?.sugarLevel || m.healthData?.hasNcd)
        );
      }
    }

    // OPTIMIZATION: Precompute lowercase search terms to prevent jank during keystrokes
    const precomputed = filtered.map(m => ({
      ...m,
      _searchStr: `${m.firstName || ''} ${m.lastName || ''} ${m.houseNo || ''}`.toLowerCase()
    }));

    setMembers(precomputed);
    setFilteredMembers(precomputed);
    setLoading(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredMembers(members);
      return;
    }
    const q = query.toLowerCase();
    const results = members.filter(m => m._searchStr.includes(q));
    setFilteredMembers(results);
  };

  const getFilterLabel = () => {
    const type = filterType?.toLowerCase();
    switch (type) {
      case 'high_risk':
      case 'high_risk_anc':
        return t('highRiskPreg');
      case 'anemia':
      case 'severe_anemia':
        return t('severeAnemiaHb');
      case 'sam':
      case 'sam_children':
        return t('samChildren');
      case 'eligible_couple':
        return t('eligibleCouples');
      case 'pnc_cases':
      case 'pnc':
        return t('pncCases');
      case 'new_anc':
        return t('newAnc');
      case 'pwd':
        return t('pwdMembers');
      case 'bpl_families':
      case 'bpl':
        return t('bplFamilies');
      case 'ncd':
      case 'ncd_screening':
        return t('ncdScreening');
      default:
        return t('villageMembers', 'Village Members');
    }
  };

  const handleDeleteMember = (memberId, name) => {
    const displayName = name.trim() === 'undefined undefined' ? 'Unnamed Member' : name;
    
    const confirmDelete = async () => {
      // LOGIC-7 FIX: Wrap both operations in a single atomic lock so no concurrent
      // write can insert a record between the saveAll and addToDeleteQueue calls.
      await storage.withLock(async () => {
        const allMembers = await storage._getAll(STORAGE_KEYS.MEMBERS);
        const updatedMembers = allMembers.filter(m => m.id !== memberId);
        await storage._saveAll(STORAGE_KEYS.MEMBERS, updatedMembers);
        if (memberId) {
          await storage._addToDeleteQueue(STORAGE_KEYS.MEMBERS, memberId);
        }
      });
      loadMembers();
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

  const handleMemberInteraction = (member) => {
    if (!filterType) {
      toggleExpandMember(member);
      return;
    }
    
    const type = filterType.toLowerCase();
    let initialTab = null;

    if (type === 'eligible_couple') initialTab = 'FP';
    else if (['high_risk_anc', 'new_anc', 'pnc_cases', 'pnc', 'high_risk'].includes(type)) initialTab = 'ANC';
    else if (['sam_children', 'sam'].includes(type)) initialTab = 'CHILD';
    else if (['ncd_screening', 'ncd'].includes(type)) initialTab = 'NCD';

    if (initialTab) {
      onNavigate('HealthTracker', { member, initialTab });
    } else {
      toggleExpandMember(member);
    }
  };

  const toggleExpandMember = (member) => {
    if (expandedMemberId === member.id) {
      setExpandedMemberId(null);
    } else {
      setExpandedMemberId(member.id);
      setQuickVitals({
        weight: member.healthData?.weight || '',
        bp: member.healthData?.bpSystolic ? `${member.healthData.bpSystolic}/${member.healthData.bpDiastolic || ''}` : '',
        hb: member.healthData?.hbLevel || ''
      });
    }
  };

  const handleSaveQuickVitals = async (member) => {
    try {
      const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
      const mIndex = allMembers.findIndex(m => m.id === member.id);
      if (mIndex >= 0) {
        const mToUpdate = allMembers[mIndex];
        const bpParts = quickVitals.bp.split('/');
        
        mToUpdate.healthData = {
          ...mToUpdate.healthData,
          weight: quickVitals.weight || mToUpdate.healthData?.weight,
          hbLevel: quickVitals.hb || mToUpdate.healthData?.hbLevel,
          bpSystolic: bpParts[0] || mToUpdate.healthData?.bpSystolic,
          bpDiastolic: bpParts[1] || mToUpdate.healthData?.bpDiastolic,
        };
        
        await storage.save(STORAGE_KEYS.MEMBERS, mToUpdate);
        
        await storage.addToSyncQueue('member_update', {
          memberId: member.id,
          healthData: mToUpdate.healthData,
          updatedAt: new Date().toISOString()
        });

        const precomputed = { ...mToUpdate, _searchStr: `${mToUpdate.firstName || ''} ${mToUpdate.lastName || ''} ${mToUpdate.houseNo || ''}`.toLowerCase() };
        setMembers(prev => prev.map(m => m.id === member.id ? precomputed : m));
        setFilteredMembers(prev => prev.map(m => m.id === member.id ? precomputed : m));
        setExpandedMemberId(null);
        if (Platform.OS === 'web') window.alert(t('success', 'Vitals saved successfully')); else Alert.alert(t('success'), t('success', 'Vitals saved successfully'));
      }
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') window.alert(t('error')); else Alert.alert(t('error'));
    }
  };

  const renderMember = ({ item }) => {
    const isExpanded = expandedMemberId === item.id;
    return (
      <View style={styles.memberCardWrapper}>
        <View style={styles.memberCard}>
          <TouchableOpacity 
            style={styles.memberInfo}
            onPress={() => handleMemberInteraction(item)}
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
        {/* UI-5 FIX: Guard hbLevel > 0 so unset/default hbLevel=0 doesn't trigger false ANEMIA badge */}
        {parseFloat(item.healthData?.hbLevel) > 0 && parseFloat(item.healthData.hbLevel) < 7 && (
          <View style={[styles.badge, { backgroundColor: '#FFEDD5', borderColor: '#EA580C', borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color: '#EA580C' }]}>🟠 {t('anemia', 'ANEMIA')}</Text>
          </View>
        )}
        {item.healthData?.hasNcd && (
          <View style={[styles.badge, { backgroundColor: '#FEF9C3', borderColor: '#CA8A04', borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color: '#CA8A04' }]}>🟡 {t('ncd', 'NCD')}</Text>
          </View>
        )}
        {/* UI-6 FIX: Use MUAC (primary) or malnutritionStatus (fallback) instead of weight<10kg proxy.
              WHO clinical definition for SAM: MUAC < 11.5cm for children 6-59 months. */}
        {(() => {
          const muac = parseFloat(item.healthData?.muac);
          const isSam = (muac > 0 && muac < 11.5) || item.healthData?.malnutritionStatus === 'SAM';
          const isMam = (muac >= 11.5 && muac < 12.5) || item.healthData?.malnutritionStatus === 'MAM';
          const childAge = parseInt(item.age);
          if ((isSam || isMam) && childAge < 5) {
            return (
              <View style={[styles.badge, { backgroundColor: isSam ? '#FEE2E2' : '#FEF9C3', borderColor: isSam ? COLORS.error : '#CA8A04', borderWidth: 1 }]}>
                <Text style={[styles.badgeText, { color: isSam ? COLORS.error : '#CA8A04' }]}>
                  {isSam ? `🔴 ${t('sam', 'SAM')}` : `🟡 ${t('mam', 'MAM')}`}
                </Text>
              </View>
            );
          }
          return null;
        })()}
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
        <TouchableOpacity onPress={() => toggleExpandMember(item)}>
          <Text style={styles.arrow}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <View style={styles.expandedPanel}>
          <Text style={styles.panelTitle}>Quick Vitals</Text>
          <View style={styles.vitalsRow}>
            <View style={styles.vitalInputGroup}>
              <Text style={styles.vitalLabel}>Weight (kg)</Text>
              <TextInput style={styles.vitalInput} keyboardType="numeric" value={quickVitals.weight} onChangeText={t => setQuickVitals(p => ({...p, weight: t}))} />
            </View>
            <View style={styles.vitalInputGroup}>
              <Text style={styles.vitalLabel}>BP (SYS/DIA)</Text>
              <TextInput style={styles.vitalInput} placeholder="120/80" value={quickVitals.bp} onChangeText={t => setQuickVitals(p => ({...p, bp: t}))} />
            </View>
            <View style={styles.vitalInputGroup}>
              <Text style={styles.vitalLabel}>Hb (g/dL)</Text>
              <TextInput style={styles.vitalInput} keyboardType="numeric" value={quickVitals.hb} onChangeText={t => setQuickVitals(p => ({...p, hb: t}))} />
            </View>
          </View>
          <TouchableOpacity style={styles.saveVitalsBtn} onPress={() => handleSaveQuickVitals(item)}>
            <Text style={styles.saveVitalsBtnText}>Save Quick Vitals</Text>
          </TouchableOpacity>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={async () => {
              const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
              const currentFamily = allFamilies.find(f => f.id === item.familyId);
              onNavigate('MemberRegistration', { member: item, family: currentFamily });
            }}>
              <Text style={styles.quickActionText}>✏️ Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => onMemberSelect(item)}>
              <Text style={styles.quickActionText}>🩺 Clinical</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionBtn, {backgroundColor: '#FEE2E2'}]} onPress={() => handleDeleteMember(item.id, `${item.firstName} ${item.lastName}`)}>
              <Text style={[styles.quickActionText, {color: COLORS.error}]}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
          <Text style={styles.headerTitle}>{getFilterLabel()}</Text>
          <Text style={styles.headerSubtitle}>{filteredMembers.length} {t('myMembers')}</Text>
        </View>
        {familyId && (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity 
              style={[styles.addMemberBtn, { backgroundColor: '#F0F9FF', borderColor: COLORS.primary, borderWidth: 1 }]} 
              onPress={async () => {
                const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
                const currentFamily = allFamilies.find(f => f.id === familyId);
                onNavigate('FamilyRegistration', { family: currentFamily });
              }}
            >
              <Text style={[styles.addMemberBtnText, { color: COLORS.primary }]}>✏️ {t('editFamily', 'Edit Family')}</Text>
            </TouchableOpacity>
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
          </View>
        )}
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchHouseName')}
          placeholderTextColor={COLORS.textSecondary}
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
    paddingBottom: 120,
  },
  memberCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
    flexWrap: 'wrap',
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
  memberCardWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden'
  },
  expandedPanel: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC'
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  vitalInputGroup: {
    flex: 1
  },
  vitalLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600'
  },
  vitalInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: COLORS.text
  },
  saveVitalsBtn: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16
  },
  saveVitalsBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text
  }
});

export default MemberListScreen;
