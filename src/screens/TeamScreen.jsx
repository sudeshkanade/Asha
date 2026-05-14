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
import { useTranslation } from 'react-i18next';

const TeamScreen = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [team, setTeam] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    setLoading(true);
    const allUsers = await storage.getAll(STORAGE_KEYS.USERS);
    const hierarchy = [];

    // 1. Find the Medical Officer (MO) for this PHC
    const mo = allUsers.find(u => !u.deleted && u.role === 'MO' && u.phcId === user?.phcId);
    if (mo) {
      hierarchy.push({
        role: t('mo'),
        name: mo.name,
        designation: t('phcInCharge', 'PHC In-Charge'),
        phone: mo.phone || t('contactPhc', 'Contact PHC'),
        location: mo.phcName || t('phc'),
        icon: '🏥',
      });
    }

    // 2. Find the ANM for this Sub-Center
    const anm = allUsers.find(u => !u.deleted && u.role === 'ANM' && u.subCenterId === user?.subCenterId);
    if (anm) {
      hierarchy.push({
        role: t('anmSupervisor', 'ANM (Supervisor)'),
        name: anm.name,
        designation: t('anmFull', 'Auxiliary Nurse Midwife'),
        phone: anm.phone || t('contactSc', 'Contact SC'),
        location: anm.subCenterName || t('subCenter'),
        icon: '👩‍⚕️',
      });
    }

    // 3. Fallback/Default Team Members if none found in DB
    if (hierarchy.length === 0) {
      hierarchy.push({
        role: 'System Support',
        name: 'Hierarchy Not Assigned',
        designation: 'Please contact Admin to link MO/ANM',
        phone: '',
        location: 'District Health Office',
        icon: '⚠️',
      });
    }

    setTeam(hierarchy);
    setLoading(false);
  };

  const emergencyContacts = [
    { label: 'Ambulance (108)', number: '108', icon: '🚑' },
    { label: 'Janani Express', number: '102', icon: '🤰' },
    { label: 'Child Helpline', number: '1098', icon: '👶' },
    { label: 'Women Helpline', number: '181', icon: '🆘' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t('myTeam')}</Text>
          <Text style={styles.headerSubtitle}>{t('reportingHierarchyCheck', 'Reporting Hierarchy Check')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Team Hierarchy */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('reportingHierarchy')}</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            team.map((member, i) => (
              <View key={i} style={styles.memberCard}>
                <Text style={styles.memberIcon}>{member.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberRole}>{member.role}</Text>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberDesig}>{member.designation}</Text>
                  <Text style={styles.memberLocation}>{member.location}</Text>
                </View>
                {member.phone && (
                  <TouchableOpacity style={styles.callBtn}>
                    <Text style={styles.callBtnText}>📞</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Emergency Numbers */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('emergencyNumbers')}</Text>
          <View style={styles.emergencyGrid}>
            {emergencyContacts.map((contact, i) => (
              <TouchableOpacity key={i} style={styles.emergencyCard}>
                <Text style={styles.emergencyIcon}>{contact.icon}</Text>
                <Text style={styles.emergencyLabel}>{contact.label}</Text>
                <Text style={styles.emergencyNumber}>{contact.number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: '#FFF7ED' }]}>
          <Text style={[styles.sectionTitle, { color: '#EA580C' }]}>⚡ {t('quickEscalation', 'Quick Escalation')}</Text>
          <Text style={styles.infoText}>
            {t('hrpEscalationMsg', 'For high-risk pregnancies (Hb < 7, BP > 140/90), contact the ANM immediately. If unreachable, escalate to the Medical Officer.')}
          </Text>
          <Text style={[styles.infoText, { marginTop: 8 }]}>
            {t('maternalEmergencyMsg', 'For maternal/neonatal emergencies, call 108 (Ambulance) immediately and inform the ANM.')}
          </Text>
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
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 16 },
  memberCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  memberIcon: { fontSize: 32, marginRight: 14 },
  memberRole: { fontSize: 11, fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  memberName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  memberDesig: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  memberLocation: { fontSize: 11, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 1 },
  callBtn: { padding: 12, backgroundColor: '#F0FDF4', borderRadius: 12 },
  callBtnText: { fontSize: 20 },
  emergencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  emergencyCard: { width: '47%', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, alignItems: 'center' },
  emergencyIcon: { fontSize: 28, marginBottom: 6 },
  emergencyLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  emergencyNumber: { fontSize: 20, fontWeight: '800', color: COLORS.error, marginTop: 4 },
  infoText: { fontSize: 13, color: '#9A3412', lineHeight: 20 },
});

export default TeamScreen;
