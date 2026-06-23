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
    const showError = (msg) => {
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert(t('error'), msg);
    };

    if (!formData.sessionDate) {
      showError(t('sessionDateRequired', 'Session date is required.'));
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.sessionDate)) {
      showError(t('invalidDateFormat', 'Session date must be in YYYY-MM-DD format.'));
      return;
    }

    const parseYyyyMmDd = (str) => {
      const parts = str.split('-');
      if (parts.length !== 3) return null;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) {
        return null;
      }
      return date;
    };

    const sDate = parseYyyyMmDd(formData.sessionDate);
    if (!sDate) {
      showError(t('invalidSessionDate', 'Invalid session date. Please check year, month, and day.'));
      return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    if (sDate > today) {
      showError(t('sessionDateInFuture', 'Session date cannot be in the future.'));
      return;
    }

    const checkNonNegativeInt = (val, fieldLabel) => {
      if (val !== undefined && val !== null && val !== '') {
        const trimmed = String(val).trim();
        if (trimmed !== '') {
          const num = parseInt(trimmed, 10);
          if (isNaN(num) || num < 0 || String(num) !== trimmed) {
            return `${fieldLabel} must be a valid non-negative integer.`;
          }
        }
      }
      return null;
    };

    const attendeeFields = [
      { key: 'pregnantAttended', label: t('pregnantWomen', 'Pregnant Women') },
      { key: 'childrenAttended', label: t('children05', 'Children (0-5)') },
      { key: 'adolescentsAttended', label: t('adolescents', 'Adolescents') }
    ];

    for (const f of attendeeFields) {
      const err = checkNonNegativeInt(formData[f.key], f.label);
      if (err) {
        showError(err);
        return;
      }
    }

    const stockFields = [
      { key: 'ifaDistributed', label: t('ironTablets', 'Iron Tablets') },
      { key: 'orsDistributed', label: t('orsPackets', 'ORS Packets') },
      { key: 'condomsDistributed', label: t('condoms', 'Condoms') },
      { key: 'ocpDistributed', label: t('ocpStrips', 'OCP Strips') },
      { key: 'ecpDistributed', label: t('ecpStrips', 'ECP Strips') }
    ];

    for (const f of stockFields) {
      const err = checkNonNegativeInt(formData[f.key], f.label);
      if (err) {
        showError(err);
        return;
      }
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
    
    // Deduct from central stock
    const allStock = await storage.getAll(STORAGE_KEYS.STOCK);
    let stockAlerts = [];
    let stockUpdated = false;

    const deductMap = {
      'ifa': session.ifaDistributed,
      'ors': session.orsDistributed,
      'condom': session.condomsDistributed,
      'ocp': session.ocpDistributed,
      'ecp': session.ecpDistributed
    };

    const updatedStock = allStock.map(item => {
      let deducted = false;
      let newQty = item.currentQuantity || 0;
      
      Object.keys(deductMap).forEach(key => {
        if (deductMap[key] > 0 && (String(item.id).toLowerCase().includes(key) || String(item.name).toLowerCase().includes(key))) {
          newQty = Math.max(0, newQty - deductMap[key]);
          deducted = true;
          deductMap[key] = 0; 
        }
      });

      if (deducted) {
        stockUpdated = true;
        const minThresh = item.minThreshold !== undefined ? item.minThreshold : 10;
        if (newQty <= minThresh) {
          stockAlerts.push(`${item.name || key} is running low (${newQty} remaining).`);
        }
      }
      return { ...item, currentQuantity: newQty };
    });

    if (stockUpdated) {
      await storage.saveAll(STORAGE_KEYS.STOCK, updatedStock);
      for (const item of updatedStock) {
        await storage.addToSyncQueue(STORAGE_KEYS.STOCK, item);
      }
    }

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
      if (stockAlerts.length > 0) {
        window.alert(t('warning') + ':\n' + stockAlerts.join('\n'));
      }
      if (window.confirm(t('vhndSuccessNotify'))) {
        notifySupervisor();
      } else {
        onBack();
      }
    } else {
      if (stockAlerts.length > 0) {
        Alert.alert(t('warning', 'Low Stock Alert'), stockAlerts.join('\n'));
      }
      Alert.alert(t('success'), t('vhndSuccessNotify'), [
        { text: t('no'), onPress: onBack, style: 'cancel' },
        { text: t('notifyWhatsApp'), onPress: notifySupervisor }
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
