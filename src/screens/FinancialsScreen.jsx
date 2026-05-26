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

const FinancialsScreen = ({ user, onBack, onNavigate }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('Referrals');
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    
    // FIX: Scope members to user's jurisdiction (consistent with every other screen)
    let members = allMembers;
    if (user?.role === 'ASHA') {
      members = allMembers.filter(m => m.ashaId === user.id || m.villageId === user.villageId);
    } else if (user?.role === 'ANM') {
      members = allMembers.filter(m => m.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      members = allMembers.filter(m => m.phcId === user.phcId);
    }

    // Referral Tickets: High Risk cases needing closure
    // FIX: Use parseFloat for hbLevel — stored as string, direct comparison `< 7` fails
    const tickets = members
      .filter(m => m.healthData?.isHighRisk || parseFloat(m.healthData?.hbLevel) < 7)
      .map(m => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        type: parseFloat(m.healthData?.hbLevel) < 7 ? t('severeAnemia') : t('highRiskPreg'),
        status: (m.referralStatus || 'open').toLowerCase(),
        village: m.villageName,
        asha: m.ashaId
      }));
    
    setReferrals(tickets);

    // RUTHLESS FIX: Load Real Payment Status from Claims Registry
    const allClaims = await storage.getAll(STORAGE_KEYS.CLAIMS);
    // FIX: Scope claims to user's jurisdiction
    let scopedClaims = allClaims;
    if (user?.role === 'ASHA') {
      scopedClaims = allClaims.filter(c => c.ashaId === user.id);
    } else if (user?.role === 'ANM') {
      scopedClaims = allClaims.filter(c => c.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      scopedClaims = allClaims.filter(c => c.phcId === user.phcId);
    }

    const paymentsData = scopedClaims.map(c => ({
      id: c.id,
      name: c.memberName,
      scheme: c.activityType.replace(/_/g, ' '),
      status: c.status.toLowerCase(),
      amount: c.amount
    }));
    
    setPayments(paymentsData);
    setLoading(false);
  };

  const handleCloseTicket = async (ticket) => {
    Alert.alert(
      t('closeReferralTicket', 'Close Referral Ticket'),
      t('markAsResolvedConfirm', 'Mark {{name}} as treated/resolved?', { name: ticket.name }),
      [
        { text: t('cancel', 'Cancel') },
        { 
          text: t('confirm', 'Confirm'), 
          onPress: async () => {
            const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
            const memberToUpdate = allMembers.find(m => m.id === ticket.id);
            if (memberToUpdate) {
              const updatedMember = {
                ...memberToUpdate,
                referralStatus: 'Closed',
                lastUpdatedAt: Date.now()
              };
              await storage.save(STORAGE_KEYS.MEMBERS, updatedMember);
              loadData();
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('financialGovernance')}</Text>
      </View>

      <View style={styles.tabContainer}>
        {['Referrals', 'Payments', 'Incentives'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{t(tab.toLowerCase())}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : activeTab === 'Referrals' ? (
          <FlatList
            data={referrals}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'open' ? COLORS.error : COLORS.success }]}>
                    <Text style={styles.statusText}>{t(item.status === 'open' ? 'open' : 'closedStatus')}</Text>
                  </View>
                </View>
                <Text style={styles.cardSub}>{item.type} • {item.village}</Text>
                {item.status === 'open' && (
                  <TouchableOpacity style={styles.closeBtn} onPress={() => handleCloseTicket(item)}>
                    <Text style={styles.closeBtnText}>✓ {t('markResolved', 'Mark Resolved')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>{t('noPendingReferrals')}</Text>}
          />
        ) : activeTab === 'Payments' ? (
          <FlatList
            data={payments}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.paymentCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentName}>{item.name}</Text>
                  <Text style={styles.paymentScheme}>{item.scheme} • ₹{item.amount}</Text>
                </View>
                <Text style={[styles.paymentStatus, { color: item.status === 'processed' ? COLORS.success : (item.status === 'rejected' ? COLORS.error : COLORS.primary) }]}>
                  {t(item.status)}
                </Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.center}>
            <Text style={styles.empty}>{t('incentiveHub', 'Incentive Verification Hub')}</Text>
            <Text style={styles.cardSub}>{t('reviewClaims', 'Review and approve ASHA claim forms for this month.')}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => onNavigate('Claims')}>
              <Text style={styles.primaryBtnText}>{t('openClaimsRegister', 'Open Claims Register')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: 24, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
  },
  backBtn: { padding: 10, marginRight: 10 },
  backBtnText: { fontSize: 24, color: '#FFF', fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  tabContainer: {
    flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.secondary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  activeTabText: { color: COLORS.secondary, fontWeight: '800' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#FFF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: 12 },
  closeBtn: { backgroundColor: COLORS.secondary, padding: 10, borderRadius: 8, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  paymentCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderRadius: 12, marginBottom: 8 },
  paymentName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  paymentScheme: { fontSize: 12, color: COLORS.textSecondary },
  paymentStatus: { fontSize: 14, fontWeight: '800' },
  empty: { textAlign: 'center', marginTop: 40, color: COLORS.textSecondary, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  primaryBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, marginTop: 20 },
  primaryBtnText: { color: '#FFF', fontWeight: '700' },
});

export default FinancialsScreen;
