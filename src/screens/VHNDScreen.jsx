import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { cloudSyncManager } from '../database/cloudSync';
import { incentiveManager } from '../utils/incentiveManager';
import { useTranslation } from 'react-i18next';

const VHNDScreen = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    venue: '',
    pregnantAttended: '',
    childrenAttended: '',
    adolescentsAttended: '',
    ifaDistributed: '',
    orsDistributed: '',
    condomsDistributed: '',
    ocpDistributed: '',
    ecpDistributed: '',
    notes: '',
  });

  const stockItems = [
    { key: 'ifaDistributed', label: t('ironTablets'), icon: '💊', placeholder: '0' },
    { key: 'orsDistributed', label: t('orsPackets'), icon: '🧂', placeholder: '0' },
    { key: 'condomsDistributed', label: t('condoms'), icon: '🔒', placeholder: '0' },
    { key: 'ocpDistributed', label: t('ocpStrips'), icon: '💊', placeholder: '0' },
    { key: 'ecpDistributed', label: t('ecpStrips'), icon: '⚡', placeholder: '0' },
  ];

  const handleSave = async () => {
    if (!formData.sessionDate) {
      Alert.alert(t('error', 'Error'), t('sessionDateRequired', 'Session date is required.'));
      return;
    }
    
    try {
      const lockedPeriods = await storage.getAll(STORAGE_KEYS.LOCKED_PERIODS);
      const currentMonth = formData.sessionDate.slice(0, 7);
      if (lockedPeriods.some(p => p.id === currentMonth)) {
         if (Platform.OS === 'web') window.alert(t('periodLockedError', 'This reporting period is locked.'));
         else Alert.alert(t('error', 'Error'), t('periodLockedError', 'This reporting period is locked.'));
         return;
      }
    } catch(e) {}

    const session = {
      id: storage.generateId('vhnd', user?.id),
      type: 'VHND',
      ashaId: user?.id,
      villageId: user?.villageId,
      villageName: user?.villageName,
      subCenterId: user?.subCenterId,
      subCenterName: user?.subCenterName,
      phcId: user?.phcId,
      phcName: user?.phcName,
      ...formData,
      pregnantAttended: parseInt(formData.pregnantAttended) || 0,
      childrenAttended: parseInt(formData.childrenAttended) || 0,
      adolescentsAttended: parseInt(formData.adolescentsAttended) || 0,
      ifaDistributed: parseInt(formData.ifaDistributed) || 0,
      orsDistributed: parseInt(formData.orsDistributed) || 0,
      condomsDistributed: parseInt(formData.condomsDistributed) || 0,
      ocpDistributed: parseInt(formData.ocpDistributed) || 0,
      ecpDistributed: parseInt(formData.ecpDistributed) || 0,
    };

    await storage.save(STORAGE_KEYS.VHND_SESSIONS, session);
    // Auto-generate VHND_SESSION incentive claim for ASHA workers
    if (user?.role === 'ASHA') {
      await incentiveManager.processEventTriggers(session, user);
    }
    // Immediately push to cloud so supervisor sees it right away
    cloudSyncManager.startBackgroundSync().catch(e => console.warn('VHND sync failed:', e.message));
    
    const notifySupervisor = () => {
      const beneficiaries = (parseInt(formData.pregnantAttended) || 0) + (parseInt(formData.childrenAttended) || 0) + (parseInt(formData.adolescentsAttended) || 0);
      const msg = `VHND Session Report:\nDate: ${session.sessionDate}\nVenue: ${session.venue || 'Village'}\nBeneficiaries: ${beneficiaries}\nPlease review the details.`;
      Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
      onBack();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('VHND session logged successfully! Do you want to notify your supervisor via WhatsApp?')) {
        notifySupervisor();
      } else {
        onBack();
      }
    } else {
      Alert.alert('Success', 'VHND session logged successfully! Notify supervisor?', [
        { text: 'No', onPress: onBack, style: 'cancel' },
        { text: 'Notify (WhatsApp)', onPress: notifySupervisor }
      ]);
    }
  };

  const totalBeneficiaries = (parseInt(formData.pregnantAttended) || 0) +
    (parseInt(formData.childrenAttended) || 0) +
    (parseInt(formData.adolescentsAttended) || 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t('vhndLog')}</Text>
          <Text style={styles.headerSubtitle}>{t('vhndFull')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Session Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('sessionDetails')}</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('sessionDate')} <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={formData.sessionDate}
              onChangeText={(t) => setFormData({ ...formData, sessionDate: t })}
              placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textSecondary} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('venueAWC')}</Text>
            <TextInput style={styles.input} value={formData.venue}
              onChangeText={(t) => setFormData({ ...formData, venue: t })}
              placeholder={t('awcPlaceholder')} placeholderTextColor={COLORS.textSecondary} />
          </View>
        </View>

        {/* Beneficiaries */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('beneficiariesAttended')}</Text>
          <View style={styles.statBar}>
            <Text style={styles.statBarText}>{t('total')}: {totalBeneficiaries}</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, minWidth: 100 }]}>
              <Text style={styles.label}>🤰 {t('pregnantWomen')}</Text>
              <TextInput style={styles.input} value={formData.pregnantAttended}
                onChangeText={(t) => setFormData({ ...formData, pregnantAttended: t })}
                placeholder="0" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, minWidth: 100 }]}>
              <Text style={styles.label}>👶 {t('children05')}</Text>
              <TextInput style={styles.input} value={formData.childrenAttended}
                onChangeText={(t) => setFormData({ ...formData, childrenAttended: t })}
                placeholder="0" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, minWidth: 100 }]}>
              <Text style={styles.label}>🧑 {t('adolescents')}</Text>
              <TextInput style={styles.input} value={formData.adolescentsAttended}
                onChangeText={(t) => setFormData({ ...formData, adolescentsAttended: t })}
                placeholder="0" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" />
            </View>
          </View>
        </View>

        {/* Stock Distribution */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('stockLedger')}</Text>
          {stockItems.map(item => (
            <View key={item.key} style={styles.stockRow}>
              <Text style={styles.stockLabel}>{item.icon} {item.label}</Text>
              <TextInput
                style={styles.stockInput}
                value={formData[item.key]}
                onChangeText={(t) => setFormData({ ...formData, [item.key]: t })}
                placeholder={item.placeholder}
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />
            </View>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('sessionNotes')}</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={formData.notes}
            onChangeText={(t) => setFormData({ ...formData, notes: t })}
            placeholder={t('notesPlaceholder')}
            placeholderTextColor={COLORS.textSecondary}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('submitVHND')}</Text>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  required: { color: COLORS.error },
  input: { height: 48, backgroundColor: '#FAFAFA', borderRadius: 8, paddingHorizontal: 12, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statBar: { backgroundColor: '#F0F4FF', padding: 10, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  statBarText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  stockRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  stockLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1 },
  stockInput: { width: 80, height: 44, backgroundColor: '#FAFAFA', borderRadius: 8, paddingHorizontal: 12, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, textAlign: 'center', color: COLORS.text },
  saveButton: { height: 52, backgroundColor: COLORS.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default VHNDScreen;
