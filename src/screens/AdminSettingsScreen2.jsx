import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { DEFAULT_INCENTIVE_RATES } from '../utils/claimsLogic';

const AdminSettingsScreen = ({ user, onBack }) => {
  const [rates, setRates] = useState({ ...DEFAULT_INCENTIVE_RATES });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      const configItems = await storage.getAll(STORAGE_KEYS.APP_CONFIG);
      const ratesConfig = configItems.find(c => c.id === 'incentive_rates');
      if (ratesConfig && ratesConfig.rates) {
        setRates({ ...DEFAULT_INCENTIVE_RATES, ...ratesConfig.rates });
      }
    } catch (e) {
      console.error('Error loading rates', e);
    }
  };

  const updateRate = (key, value) => {
    setRates({ ...rates, [key]: parseInt(value) || 0 });
    setHasChanges(true);
  };

  const handleSave = async () => {
    const ratesConfig = {
      id: 'incentive_rates',
      rates: rates,
      updatedBy: user?.name || 'Admin',
      updatedAt: new Date().toISOString(),
    };
    await storage.save(STORAGE_KEYS.APP_CONFIG, ratesConfig);
    setHasChanges(false);
    Alert.alert('Success', 'Incentive rates updated successfully. All ASHA earnings will now use these new rates.');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will restore all incentive rates to the standard government amounts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: () => {
            setRates({ ...DEFAULT_INCENTIVE_RATES });
            setHasChanges(true);
          }
        }
      ]
    );
  };

  const rateFields = [
    { key: 'ANC_REGISTRATION', label: 'ANC Registration', desc: 'Per new pregnancy registered', icon: '🤰' },
    { key: 'INSTITUTIONAL_DELIVERY', label: 'Institutional Delivery', desc: 'Per hospital delivery facilitated', icon: '🏥' },
    { key: 'FULL_IMMUNIZATION', label: 'Full Immunization', desc: 'Per child fully immunized', icon: '💉' },
    { key: 'HBNC_VISIT', label: 'HBNC Home Visit', desc: 'Per home visit completed', icon: '🏠' },
    { key: 'VHND_SESSION', label: 'VHND Session', desc: 'Per outreach session conducted', icon: '🏕️' },
    { key: 'NCD_SCREENING', label: 'NCD Screening', desc: 'Per NCD screening performed (30+)', icon: '🩺' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Incentive Rate Settings</Text>
          <Text style={styles.headerSubtitle}>ANM / Admin Configuration Panel</Text>
        </View>
        {hasChanges && (
          <View style={styles.unsavedBadge}>
            <Text style={styles.unsavedText}>Unsaved</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: '#FFF7ED' }]}>
          <Text style={styles.warningText}>⚠️ Changes here affect incentive calculations for all ASHAs under your supervision. Ensure rates match current government notifications.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Activity-Based Incentives (₹)</Text>
          {rateFields.map((field, i) => (
            <View key={i} style={styles.rateRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rateLabel}>{field.icon} {field.label}</Text>
                <Text style={styles.rateDesc}>{field.desc}</Text>
              </View>
              <View style={styles.rateInputWrap}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.rateInput}
                  value={rates[field.key]?.toString()}
                  onChangeText={(t) => updateRate(field.key, t)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Reset to Defaults</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]} onPress={handleSave} disabled={!hasChanges}>
            <Text style={styles.saveBtnText}>Publish Rates</Text>
          </TouchableOpacity>
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
  unsavedBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  unsavedText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  warningText: { fontSize: 13, color: '#9A3412', lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 16 },
  rateRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  rateLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  rateDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  rateInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  currencySymbol: { paddingLeft: 10, fontSize: 15, color: COLORS.textSecondary },
  rateInput: { width: 70, height: 44, paddingHorizontal: 8, fontSize: 16, fontWeight: '700', textAlign: 'right', color: COLORS.text },
  buttonRow: { flexDirection: 'row', gap: 12 },
  resetBtn: { flex: 1, height: 50, borderWidth: 2, borderColor: COLORS.border, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  resetBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  saveBtn: { flex: 1, height: 50, backgroundColor: COLORS.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

export default AdminSettingsScreen;
