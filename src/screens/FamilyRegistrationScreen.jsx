import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

const FamilyRegistrationScreen = ({ user, onSave, onBack }) => {
  const { t } = useTranslation();
  const [villages, setVillages] = useState([]);
  const [formData, setFormData] = useState({
    villageId: user?.villageId || '',
    villageName: user?.village || '',
    houseNo: '',
    religionCaste: '',
    isBPL: false,
    rationCardNo: '',
    ward: user?.ward || '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    loadVillages();
  }, []);

  const loadVillages = async () => {
    const v = await storage.getAll(STORAGE_KEYS.VILLAGES);
    // FIX A4: Scope village picker by user's hierarchy
    let scopedVillages = v;
    if (user?.role === 'ANM' && user?.subCenterId) {
      scopedVillages = v.filter(vil => vil.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO' && user?.phcId) {
      scopedVillages = v.filter(vil => vil.phcId === user.phcId);
    }
    setVillages(scopedVillages);
  };

  const handleSave = () => {
    if (!formData.houseNo || !formData.villageId) {
      Alert.alert(t('error'), t('houseAndVillageRequired'));
      return;
    }
    
    const finalData = {
      ...formData,
      subCenterId: user?.subCenterId,
      phcId: user?.phcId,
      villageName: villages.find(v => v.id === formData.villageId)?.name || formData.villageName
    };

    onSave(finalData);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t('familyRegistration')}</Text>
          <Text style={styles.headerSubtitle}>{user?.village || t('selectiveAssignment')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('identityLocation')}</Text>
          
          {user?.role !== 'ASHA' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('selectVillage')}</Text>
              <View style={styles.pickerContainer}>
                {villages.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.chip, formData.villageId === v.id && styles.chipActive]}
                    onPress={() => setFormData({ ...formData, villageId: v.id, villageName: v.name, ward: v.ward })}
                  >
                    <Text style={[styles.chipText, formData.villageId === v.id && styles.chipTextActive]}>{v.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('houseNumber')} <Text style={styles.required}>*</Text></Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('houseNoExample')}
                placeholderTextColor={COLORS.textSecondary}
                value={formData.houseNo}
                onChangeText={(text) => setFormData({ ...formData, houseNo: text })}
              />
              <TouchableOpacity 
                style={styles.suggestBtn} 
                onPress={async () => {
                  const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
                  const villageFamilies = allFamilies.filter(f => f.villageId === formData.villageId);
                  const houseNos = villageFamilies
                    .map(f => parseInt(f.houseNo))
                    .filter(n => !isNaN(n));
                  const nextNo = houseNos.length > 0 ? Math.max(...houseNos) + 1 : 1;
                  setFormData({ ...formData, houseNo: nextNo.toString() });
                }}
              >
                <Text style={styles.suggestBtnText}>{t('suggest')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('gpsCoordinates', 'GPS Coordinates')}</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Latitude, Longitude"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : ''}
                editable={false}
              />
              <TouchableOpacity 
                style={[styles.suggestBtn, { backgroundColor: '#F0FDF4', borderColor: '#10B981' }]} 
                onPress={() => {
                  if (typeof navigator !== 'undefined' && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setFormData({
                          ...formData,
                          latitude: pos.coords.latitude.toFixed(6),
                          longitude: pos.coords.longitude.toFixed(6),
                        });
                        Alert.alert(t('success', 'Success'), t('gpsCaptured', 'GPS Coordinates captured successfully.'));
                      },
                      (err) => {
                        Alert.alert(t('error'), t('gpsError', 'Failed to retrieve location. Please check browser permissions.'));
                      },
                      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                    );
                  } else {
                    Alert.alert(t('error'), t('gpsNotSupported', 'Geolocation is not supported by this device.'));
                  }
                }}
              >
                <Text style={[styles.suggestBtnText, { color: '#10B981' }]}>📍 {t('capture', 'Capture')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('categoryCaste')} <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerContainer}>
              {['General', 'SC', 'ST', 'OBC', 'Minority'].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.chip,
                    formData.religionCaste === c && styles.chipActive
                  ]}
                  onPress={() => setFormData({ ...formData, religionCaste: c })}
                >
                  <Text style={[
                    styles.chipText,
                    formData.religionCaste === c && styles.chipTextActive
                  ]}>{t(c.toLowerCase())}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('rationCardNo')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('twelveDigitNumber')}
              placeholderTextColor={COLORS.textSecondary}
              value={formData.rationCardNo}
              onChangeText={(text) => setFormData({ ...formData, rationCardNo: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>{t('bplStatus')}</Text>
              <Text style={styles.switchSubLabel}>{t('bplStatusDesc')}</Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: COLORS.secondary }}
              thumbColor={formData.isBPL ? COLORS.primary : '#f4f3f4'}
              onValueChange={(val) => setFormData({ ...formData, isBPL: val })}
              value={formData.isBPL}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('registerFamilyAddMembers')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
          <Text style={styles.cancelButtonText}>{t('cancelBack')}</Text>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 24,
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
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  switchSubLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  saveButton: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  required: {
    color: COLORS.error,
    fontWeight: '700',
  },
  suggestBtn: {
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  suggestBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default FamilyRegistrationScreen;
