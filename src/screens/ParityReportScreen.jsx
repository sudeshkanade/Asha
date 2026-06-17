import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

const ParityReportScreen = ({ user, onNavigate, onBack }) => {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBucket, setSelectedBucket] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
      
      // Filter members to current user scope
      let scopedMembers = allMembers;
      if (user?.role === 'ASHA') {
        const rawAssigned = user.assignedVillages || [];
        const assignedIds = new Set(rawAssigned.map(v => typeof v === 'string' ? v : v?.id || v?.villageId).filter(Boolean));
        if (user?.villageId) assignedIds.add(user.villageId);
        scopedMembers = allMembers.filter(m => m.ashaId === user.id || assignedIds.has(m.villageId) || !m.villageId);
      } else if (user?.role === 'ANM') {
        scopedMembers = allMembers.filter(m => m.subCenterId === user.subCenterId);
      } else if (user?.role === 'MO') {
        scopedMembers = allMembers.filter(m => m.phcId === user.phcId);
      }
      
      setMembers(scopedMembers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const parityData = useMemo(() => {
    if (!members.length) return { counts: { 0: 0, 1: 0, 2: 0, '3+': 0 }, mothersInBuckets: { 0: [], 1: [], 2: [], '3+': [] } };

    const familyGroups = {};
    members.forEach(m => {
      if (!m.familyId) return;
      if (!familyGroups[m.familyId]) familyGroups[m.familyId] = [];
      familyGroups[m.familyId].push(m);
    });

    const mothersInBuckets = { 0: [], 1: [], 2: [], '3+': [] };
    const counts = { 0: 0, 1: 0, 2: 0, '3+': 0 };

    Object.values(familyGroups).forEach(familyMembers => {
      // Find all women aged 15-49 who might be mothers
      const women = familyMembers.filter(m => 
        m.gender === 'Female' && 
        parseInt(m.age) >= 15 && 
        parseInt(m.age) <= 49 &&
        (m.maritalStatus === 'Married' || m.relationToHead === 'Wife' || m.relation === 'Wife' || m.relationToHead === 'Daughter-in-law' || m.relation === 'Daughter-in-law' || m.relationToHead === 'Self (Head)')
      );

      women.forEach(woman => {
        // Find children whose middleName === woman's middleName
        // Local naming convention: Wife's middleName = Husband's firstName
        // Child's middleName = Father's firstName
        const womanHusbandName = String(woman.middleName || '').trim().toLowerCase();
        const womanLastName = String(woman.lastName || '').trim().toLowerCase();

        let childCount = 0;

        familyMembers.forEach(m => {
          if (m.id === woman.id) return;

          const mRel = String(m.relationToHead || m.relation).trim().toLowerCase();
          const wRel = String(woman.relationToHead || woman.relation).trim().toLowerCase();
          
          let isHerChild = false;

          // 1. Direct Relation Mapping (Robust for Head / Wife of Head)
          if (wRel === 'wife' || wRel === 'self (head)' || wRel === 'head') {
            if (mRel === 'son' || mRel === 'daughter') {
              isHerChild = true;
            }
          }
          
          // 2. Middle Name Matching (Robust for joint families like Daughter-in-law)
          if (!isHerChild && womanHusbandName) {
            const isChildRelation = ['son', 'daughter', 'grandson', 'granddaughter', 'child'].includes(mRel);
            const childMiddle = String(m.middleName || '').trim().toLowerCase();
            
            if (isChildRelation && childMiddle === womanHusbandName) {
               isHerChild = true;
            }
          }

          if (isHerChild) {
            // Sanity check on age (mother should be at least 12 years older)
            const mAge = parseInt(m.age);
            const wAge = parseInt(woman.age);
            if (!isNaN(mAge) && !isNaN(wAge)) {
               if (wAge - mAge >= 12) childCount++;
            } else {
               childCount++; // If ages are missing, default to accepting the relation
            }
          }
        });

        let bucket = '3+';
        if (childCount === 0) bucket = 0;
        else if (childCount === 1) bucket = 1;
        else if (childCount === 2) bucket = 2;

        counts[bucket]++;
        mothersInBuckets[bucket].push({
          ...woman,
          computedChildren: childCount
        });
      });
    });

    return { counts, mothersInBuckets };
  }, [members]);

  const renderMotherCard = (mother) => {
    return (
      <TouchableOpacity 
        key={mother.id} 
        style={styles.motherCard}
        onPress={() => onNavigate('HealthTracker', { member: mother })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.motherName}>{mother.firstName} {mother.middleName} {mother.lastName}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{mother.computedChildren} {t('children', 'Children')}</Text>
          </View>
        </View>
        <Text style={styles.motherDetails}>{t('age')}: {mother.age} | {t('village')}: {mother.villageName || mother.villageId || 'N/A'}</Text>
      </TouchableOpacity>
    );
  };

  const handleDownload = () => {
    try {
      const rows = [];
      ['0', '1', '2', '3+'].forEach(bucket => {
        parityData.mothersInBuckets[bucket].forEach(mother => {
          rows.push({
            'Family ID': mother.familyId || '',
            'Mother Name': `${mother.firstName || ''} ${mother.middleName || ''} ${mother.lastName || ''}`.trim(),
            'Age': mother.age || '',
            'Husband Name': mother.middleName || '',
            'Village': mother.villageName || mother.villageId || '',
            'Number of Children': mother.computedChildren,
            'Category (Bucket)': bucket
          });
        });
      });

      if (rows.length === 0) {
        Alert.alert(t('error'), t('noDataToExport', 'No data available to export.'));
        return;
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [ { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 } ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Parity Report");

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Parity_Report_${dateStr}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      console.error('Export failed', e);
      Alert.alert(t('error'), 'Export failed: ' + e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('parityReport', 'Parity Report (Mother & Children)')}</Text>
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
          <Text style={styles.downloadBtnText}>⬇️</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={styles.description}>
            {t('parityDesc', 'This report shows the number of children per eligible mother (15-49 yrs) by cross-referencing husband and father names within families.')}
          </Text>

          <View style={styles.summaryGrid}>
            {[0, 1, 2, '3+'].map(bucket => (
              <TouchableOpacity 
                key={bucket} 
                style={[styles.summaryCard, selectedBucket === bucket && styles.summaryCardActive]}
                onPress={() => setSelectedBucket(selectedBucket === bucket ? null : bucket)}
              >
                <Text style={[styles.summaryCount, selectedBucket === bucket && styles.summaryTextActive]}>
                  {parityData.counts[bucket]}
                </Text>
                <Text style={[styles.summaryLabel, selectedBucket === bucket && styles.summaryTextActive]}>
                  {bucket} {t('children', 'Children')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedBucket !== null && (
            <View style={styles.listSection}>
              <Text style={styles.listSectionTitle}>
                {t('mothersWith', 'Mothers with')} {selectedBucket} {t('children', 'Children')}
              </Text>
              {parityData.mothersInBuckets[selectedBucket].length === 0 ? (
                <Text style={styles.emptyText}>{t('noMothersFound', 'No mothers found for this category.')}</Text>
              ) : (
                parityData.mothersInBuckets[selectedBucket].map(renderMotherCard)
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
  },
  backBtn: { padding: 8 },
  backBtnText: { fontSize: 24, color: COLORS.text, fontWeight: '600' },
  downloadBtn: { padding: 8, backgroundColor: '#E2E8F0', borderRadius: 8 },
  downloadBtnText: { fontSize: 18, color: COLORS.primary, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  content: { padding: 16 },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  summaryCount: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  summaryTextActive: {
    color: COLORS.surface,
  },
  listSection: {
    marginTop: 16,
  },
  listSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  motherCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  motherName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  motherDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  }
});

export default ParityReportScreen;
