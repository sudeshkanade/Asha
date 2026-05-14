import React, { useState, useEffect } from 'react';
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
import { calculateClaims, getActiveRates } from '../utils/claimsLogic';
import { useTranslation } from 'react-i18next';

const ClaimsScreen = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [claims, setClaims] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      const allClaims = await storage.getAll(STORAGE_KEYS.CLAIMS);
      
      // Filter for current user and current month
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const userClaims = allClaims.filter(c => {
        const matchesUser = user?.role === 'ASHA' ? c.ashaId === user.id : true;
        const matchesMonth = c.month === currentMonth && c.year === currentYear;
        return matchesUser && matchesMonth;
      });

      const totalEarnings = userClaims.reduce((sum, c) => sum + (c.status === 'processed' ? c.amount : 0), 0);
      const pendingEarnings = userClaims.reduce((sum, c) => sum + (c.status === 'pending' ? c.amount : 0), 0);

      setClaims({
        totalEarnings,
        pendingEarnings,
        claimsCount: userClaims.length,
        claimsList: userClaims.map(c => ({
          type: c.activityType.replace(/_/g, ' '),
          member: c.memberName,
          amount: c.amount,
          status: c.status
        }))
      });
    } catch (e) {
      console.error('Error loading claims', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('claimsIncentives')}</Text>
          <Text style={styles.headerSubtitle}>{t('earningsBreakdown')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Earnings Summary */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>{t('totalProcessedEarnings')}</Text>
          <Text style={styles.earningsAmount}>₹{claims?.totalEarnings || 0}</Text>
          <Text style={[styles.earningsLabel, { marginTop: 10 }]}>{t('pendingApproval')}: ₹{claims?.pendingEarnings || 0}</Text>
          <Text style={styles.earningsCount}>{claims?.claimsCount || 0} {t('activitiesClaimed')}</Text>
        </View>

        {/* Claims Breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('activityBreakdown')}</Text>
          {claims?.claimsList?.length > 0 ? (
            claims.claimsList.map((claim, i) => (
              <View key={i} style={styles.claimRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.claimType}>{t(claim.type.toLowerCase().replace(/[^a-z]/g, '')) || claim.type}</Text>
                  <Text style={styles.claimMember}>{claim.member}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.claimAmount}>₹{claim.amount}</Text>
                  <Text style={[styles.claimStatus, { color: claim.status === 'processed' ? COLORS.success : COLORS.primary }]}>
                    {t(claim.status)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>{t('noClaimsMonth')}</Text>
          )}
        </View>

        {/* Rate Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('currentRates')}</Text>
          {[
            { label: t('ancRegistration'), rate: '₹25' },
            { label: t('instDelivery'), rate: '₹300' },
            { label: t('fullImmunization'), rate: '₹100' },
            { label: t('hbncHomeVisit'), rate: '₹50' },
            { label: t('vhndSession'), rate: '₹200' },
            { label: t('ncdScreening'), rate: '₹10' },
          ].map((item, i) => (
            <View key={i} style={styles.rateRow}>
              <Text style={styles.rateLabel}>{item.label}</Text>
              <Text style={styles.rateAmount}>{item.rate}</Text>
            </View>
          ))}
          <Text style={styles.rateNote}>{t('ratesNote')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, backgroundColor: COLORS.surface, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 10, marginRight: 10 },
  backBtnText: { fontSize: 24, color: COLORS.primary, fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  headerSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  earningsCard: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 24, marginBottom: 16, alignItems: 'center' },
  earningsLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  earningsAmount: { fontSize: 40, fontWeight: '800', color: '#FFF', marginVertical: 8 },
  earningsCount: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 16 },
  claimRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  claimType: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  claimMember: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  claimAmount: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
  claimStatus: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', padding: 20, lineHeight: 22 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  rateLabel: { fontSize: 14, color: COLORS.text },
  rateAmount: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  rateNote: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
});

export default ClaimsScreen;
