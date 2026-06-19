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

const FamilyRegistrationScreen = ({ user, onSave, onBack, existingFamily }) => {
  const { t } = useTranslation();
  const [villages, setVillages] = useState([]);
  const [formData, setFormData] = useState({
    villageId: existingFamily?.villageId || user?.villageId || '',
    villageName: existingFamily?.villageName || user?.village || '',
    houseNo: existingFamily?.houseNo || '',
    religionCaste: existingFamily?.religionCaste || '',
    isBPL: existingFamily?.isBPL || false,
    rationCardNo: existingFamily?.rationCardNo || '',
    ward: existingFamily?.ward || user?.ward || '',
    latitude: existingFamily?.latitude || '',
    longitude: existingFamily?.longitude || '',
  });
  const isEdit = !!existingFamily;

  useEffect(() => {
    loadVillages();
  }, []);

  const loadVillages = async () => {
    const allVillages = await storage.getAll(STORAGE_KEYS.VILLAGES);
    let scopedVillages = [];
    if (user?.role === 'ASHA') {
      const assigned = user.assignedVillages || [];
      scopedVillages = assigned.map(v => {
        const vId = typeof v === 'string' ? v : (v.id || v.villageId || v.value);
        const actualVillage = allVillages.find(vil => vil.id === vId || vil.name?.toLowerCase().trim() === String(vId).toLowerCase().trim());
        return actualVillage ? { id: actualVillage.id, name: actualVillage.name, ward: actualVillage.ward } : null;
      }).filter(Boolean);

      if (scopedVillages.length === 0 && user.villageId) {
        const primaryVil = allVillages.find(vil => vil.id === user.villageId || vil.name?.toLowerCase().trim() === String(user.villageId).toLowerCase().trim());
        if (primaryVil) {
          scopedVillages.push({ id: primaryVil.id, name: primaryVil.name, ward: primaryVil.ward });
        } else {
          scopedVillages.push({ id: user.villageId, name: user.village || 'My Village' });
        }
      }
    } else {
      scopedVillages = allVillages;
      if (user?.role === 'ANM' && user?.subCenterId) {
        scopedVillages = allVillages.filter(vil => vil.subCenterId === user.subCenterId);
      } else if (user?.role === 'MO' && user?.phcId) {
        scopedVillages = allVillages.filter(vil => vil.phcId === user.phcId);
      }
    }
    setVillages(scopedVillages);

    if (user?.role === 'ASHA' && scopedVillages.length > 0) {
      const exists = scopedVillages.some(v => v.id === formData.villageId);
      if (!exists) {
        setFormData(prev => ({
          ...prev,
          villageId: scopedVillages[0].id,
          villageName: scopedVillages[0].name,
          ward: scopedVillages[0].ward || prev.ward
        }));
      }
    }
  };

  const handleSave = () => {
    if (!formData.villageId) {
      if (Platform.OS === 'web') window.alert(t('villageRequired', 'Village selection is required.'));
      else Alert.alert(t('error'), t('villageRequired', 'Village selection is required.'));
      return;
    }
    if (!formData.houseNo || !formData.houseNo.trim()) {
      if (Platform.OS === 'web') window.alert(t('houseRequired', 'House number is required.'));
      else Alert.alert(t('error'), t('houseRequired', 'House number is required.'));
      return;
    }
    if (!formData.religionCaste) {
      if (Platform.OS === 'web') window.alert(t('casteRequired', 'Category/Caste is required.'));
      else Alert.alert(t('error'), t('casteRequired', 'Category/Caste is required.'));
      return;
    }
    if (formData.rationCardNo && !/^\d{12}$/.test(formData.rationCardNo)) {
      if (Platform.OS === 'web') window.alert(t('invalidRationCard', 'Ration card number must be exactly 12 digits.'));
      else Alert.alert(t('error'), t('invalidRationCard', 'Ration card number must be exactly 12 digits.'));
      return;
    }
    if (formData.latitude) {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        if (Platform.OS === 'web') window.alert(t('invalidLatitude', 'Latitude must be a valid number between -90 and 90.'));
        else Alert.alert(t('error'), t('invalidLatitude', 'Latitude must be a valid number between -90 and 90.'));
        return;
      }
    }
    if (formData.longitude) {
      const lng = parseFloat(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        if (Platform.OS === 'web') window.alert(t('invalidLongitude', 'Longitude must be a valid number between -180 and 180.'));
        else Alert.alert(t('error'), t('invalidLongitude', 'Longitude must be a valid number between -180 and 180.'));
        return;
      }
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
          <Text style={styles.headerTitle}>{isEdit ? t('editFamilyDetails', 'Edit Family Details') : t('familyRegistration')}</Text>
          <Text style={styles.headerSubtitle}>{user?.village || t('selectiveAssignment')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('identityLocation')}</Text>
          
          {(user?.role !== 'ASHA' || villages.length > 0) && (
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
                value={formData.latitude || formData.longitude ? `${formData.latitude || ''}, ${formData.longitude || ''}` : ''}
                onChangeText={(text) => {
                  const parts = text.split(',');
                  setFormData({
                    ...formData,
                    latitude: parts[0] ? parts[0].trim() : '',
                    longitude: parts[1] ? parts[1].trim() : '',
                  });
                }}
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
          <Text style={styles.saveButtonText}>{isEdit ? t('updateFamily', 'Update Family') : t('registerFamilyAddMembers')}</Text>
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
