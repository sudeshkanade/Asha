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
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { getSuggestedNames, validateAadhaar, calculateAge } from '../utils/healthLogic';
import { useTranslation } from 'react-i18next';

const MemberRegistrationScreen = ({ familyHead, onSave, onBack, existingMember }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: existingMember?.firstName || '',
    middleName: existingMember?.middleName || '',
    lastName: existingMember?.lastName || '',
    relation: existingMember?.relation || 'Other',
    dob: existingMember?.dob || '',
    age: existingMember?.age || '',
    gender: existingMember?.gender || 'Female',
    maritalStatus: existingMember?.maritalStatus || 'Married',
    education: existingMember?.education || '',
    aadhaar: existingMember?.aadhaar || '',
    abhaId: existingMember?.abhaId || '',
    phone: existingMember?.phone || '',
    isPwd: existingMember?.isPwd || false,
    isMigrant: existingMember?.isMigrant || false,
    isPregnant: existingMember?.healthData?.isPregnant || false,
    hasNcd: existingMember?.healthData?.hasNcd || false,
    internalDob: existingMember?.dob || '',
    lmp: existingMember?.healthData?.lmp || '',
  });

  const isEdit = !!existingMember;
  const familyId = existingMember?.familyId || familyHead?.id || 'N/A';

  // Relationships logic...
  useEffect(() => {
    if (familyHead && formData.relation !== 'Self (Head)' && formData.relation !== 'Other') {
      const suggestions = getSuggestedNames(familyHead, formData.relation);
      setFormData(prev => ({
        ...prev,
        middleName: prev.middleName || suggestions.middleName,
        lastName: prev.lastName || suggestions.lastName,
      }));
    }
  }, [formData.relation, familyHead]);

  // Convert existing dob (YYYY-MM-DD) to DD/MM/YYYY for initial display
  useEffect(() => {
    if (existingMember?.dob && existingMember.dob.includes('-')) {
      const parts = existingMember.dob.split('-');
      if (parts.length === 3) {
        setFormData(prev => ({ ...prev, dob: `${parts[2]}/${parts[1]}/${parts[0]}` }));
      }
    }
  }, []);

  const handleDobChange = (text) => {
    let cleaned = text.replace(/[^\d/]/g, '');
    if (cleaned.length === 2 && !formData.dob.endsWith('/')) cleaned += '/';
    else if (cleaned.length === 5 && !formData.dob.endsWith('/')) cleaned += '/';

    setFormData(prev => ({ ...prev, dob: cleaned }));
    
    if (cleaned.length === 10) {
      const parts = cleaned.split('/');
      if (parts.length === 3) {
        const yyyyMmDd = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
        const age = calculateAge(yyyyMmDd);
        if (!isNaN(age) && age >= 0 && age <= 150) {
          setFormData(prev => ({ ...prev, dob: cleaned, age: age.toString(), internalDob: yyyyMmDd }));
        }
      }
    } else {
      setFormData(prev => ({ ...prev, internalDob: '' }));
    }
  };

  const handleAgeChange = (text) => {
    setFormData(prev => ({ ...prev, age: text }));
    
    if (text && !isNaN(text)) {
      const ageNum = parseInt(text, 10);
      if (ageNum >= 0 && ageNum <= 150) {
        const today = new Date();
        const year = today.getFullYear() - ageNum;
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        // Auto-set values for minors to reduce clicks
        const defaultMaritalStatus = ageNum < 18 ? 'Unmarried' : formData.maritalStatus;
        const defaultEducation = ageNum < 5 ? 'notApplicable' : formData.education;
        const defaultRelation = ageNum < 18 ? (formData.gender === 'Male' ? 'Son' : 'Daughter') : formData.relation;

        setFormData(prev => ({ 
          ...prev, 
          age: text, 
          dob: `${day}/${month}/${year}`,
          internalDob: `${year}-${month}-${day}`,
          maritalStatus: defaultMaritalStatus,
          education: defaultEducation,
          relation: defaultRelation
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, age: text, dob: '', internalDob: '' }));
    }
  };

  const validateAndSave = (addAnother = false) => {
    if (!formData.firstName || !formData.lastName) {
      Alert.alert(t('error'), 'First and Last name are required.');
      return;
    }
    if (formData.aadhaar && !validateAadhaar(formData.aadhaar)) {
      Alert.alert(t('error'), 'Aadhaar must be 12 digits.');
      return;
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      Alert.alert(t('error'), 'Phone number must be 10 digits.');
      return;
    }
    if (formData.dob && !/^\d{2}\/\d{2}\/\d{4}$/.test(formData.dob)) {
      Alert.alert(t('error'), 'Invalid date format. Use DD/MM/YYYY.');
      return;
    }
    // Ensure age is present (manual or calculated)
    if (!formData.age) {
      Alert.alert(t('error'), 'Age is required. Enter DOB or set age manually.');
      return;
    }

    // Clean up data structure for saving
    let finalDob = formData.internalDob;
    if (!finalDob && formData.dob) {
      const parts = formData.dob.split('/');
      finalDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    const { isPregnant, hasNcd, internalDob, lmp, ...rest } = formData;
    
    let edd = existingMember?.healthData?.edd;
    if (isPregnant && lmp && lmp.length === 10) {
      const parts = lmp.split('/');
      if (parts.length === 3) {
        const lmpDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(lmpDate.getTime())) {
          lmpDate.setDate(lmpDate.getDate() + 280);
          edd = lmpDate.toISOString().split('T')[0];
        }
      }
    }

    const finalData = {
      ...rest,
      dob: finalDob,
      healthData: {
        ...existingMember?.healthData,
        isPregnant,
        hasNcd,
        lmp: isPregnant ? (lmp || existingMember?.healthData?.lmp) : '',
        ancStatus: isPregnant ? 'active' : 'none',
        edd: isPregnant ? edd : ''
      }
    };

    onSave(finalData, addAnother);
  };

  const getRelationOptions = () => {
    if (formData.gender === 'Male') return ['Self (Head)', 'Husband', 'Son', 'Father', 'Brother', 'Grandson', 'Other'];
    if (formData.gender === 'Female') return ['Self (Head)', 'Wife', 'Daughter', 'Daughter-in-law', 'Mother', 'Sister', 'Granddaughter', 'Other'];
    return ['Self (Head)', 'Wife', 'Husband', 'Son', 'Daughter', 'Daughter-in-law', 'Mother', 'Father', 'Brother', 'Sister', 'Grandson', 'Granddaughter', 'Other'];
  };

  const handleRelationChange = (rel) => {
    let newGender = formData.gender;
    if (['Husband', 'Son', 'Father', 'Brother', 'Grandson'].includes(rel)) newGender = 'Male';
    else if (['Wife', 'Daughter', 'Daughter-in-law', 'Mother', 'Sister', 'Granddaughter'].includes(rel)) newGender = 'Female';
    
    setFormData({ ...formData, relation: rel, gender: newGender });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{isEdit ? t('editProfile') : t('memberRegistration')}</Text>
          <Text style={styles.headerSubtitle}>
            {isEdit ? `${t('updatingRecord')} ${formData.firstName}` : `${t('familyId')}: ${familyId}`}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('memberDetails')}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('gender')}</Text>
            <View style={styles.pickerContainer}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, formData.gender === g && styles.chipActive]}
                  onPress={() => setFormData({ ...formData, gender: g })}
                >
                  <Text style={[styles.chipText, formData.gender === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('relationToHead')}</Text>
            <View style={styles.pickerContainer}>
              {getRelationOptions().map((rel) => (
                <TouchableOpacity
                  key={rel}
                  style={[styles.chip, formData.relation === rel && styles.chipActive]}
                  onPress={() => handleRelationChange(rel)}
                >
                  <Text style={[styles.chipText, formData.relation === rel && styles.chipTextActive]}>{t(rel.toLowerCase().replace(/[^a-z]/g, '')) || rel}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('firstName')} <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder={t('firstName')}
              placeholderTextColor={COLORS.textSecondary}
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('middleName')} <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder={t('fatherHusband')}
              placeholderTextColor={COLORS.textSecondary}
              value={formData.middleName}
              onChangeText={(text) => setFormData({ ...formData, middleName: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('surname')} <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder={t('lastName')}
              placeholderTextColor={COLORS.textSecondary}
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('dob')} (DD/MM/YYYY) <Text style={styles.required}>*</Text></Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.dob}
                onChangeText={handleDobChange}
                keyboardType="numeric"
                maxLength={10}
              />
              <View style={styles.ageBadge}>
                <Text style={styles.ageBadgeLabel}>{t('age')}</Text>
                <Text style={styles.ageBadgeValue}>{formData.age || '0'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('mobile')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('mobilePlaceholder')}
              placeholderTextColor={COLORS.textSecondary}
              value={formData.mobile}
              onChangeText={(text) => setFormData({ ...formData, mobile: text })}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('aadhaar')} (12 Digits)</Text>
            <TextInput
              style={styles.input}
              value={formData.aadhaar}
              onChangeText={(text) => setFormData({ ...formData, aadhaar: text })}
              placeholder="0000 0000 0000"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              maxLength={12}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('abha')}</Text>
            <TextInput
              style={styles.input}
              value={formData.abhaId}
              onChangeText={(text) => setFormData({ ...formData, abhaId: text })}
              placeholder="Health ID"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('maritalStatus', 'Marital Status')}</Text>
            <View style={styles.pickerContainer}>
              {['Married', 'Unmarried', 'Widowed', 'Divorced'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, formData.maritalStatus === s && styles.chipActive]}
                  onPress={() => setFormData({ ...formData, maritalStatus: s })}
                >
                  <Text style={[styles.chipText, formData.maritalStatus === s && styles.chipTextActive]}>{t(s.toLowerCase())}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('education')}</Text>
            <View style={styles.pickerContainer}>
              {['Illiterate', 'Primary', 'Secondary', 'Higher Secondary', 'Graduate', 'Post Graduate', 'notApplicable'].map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.chip, formData.education === e && styles.chipActive]}
                  onPress={() => setFormData({ ...formData, education: e })}
                >
                  <Text style={[styles.chipText, formData.education === e && styles.chipTextActive]}>{t(e === 'notApplicable' ? 'na' : e.toLowerCase().replace(/ /g, '')) || e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>{t('flags', 'Flags')}</Text>
          
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>{t('pwdStatus', 'PwD Status')}</Text>
            </View>
            <Switch
              value={formData.isPwd}
              onValueChange={(val) => setFormData({ ...formData, isPwd: val })}
              trackColor={{ false: '#D1DBCE', true: COLORS.primary }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>{t('migrantStatus', 'Migrant Status')}</Text>
            </View>
            <Switch
              value={formData.isMigrant}
              onValueChange={(val) => setFormData({ ...formData, isMigrant: val })}
              trackColor={{ false: '#D1DBCE', true: COLORS.primary }}
            />
          </View>

          {formData.gender === 'Female' && (parseInt(formData.age) >= 15 || !formData.age) && (
            <>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>{t('isPregnantAnc', 'Is Currently Pregnant? (ANC)')}</Text>
                </View>
                <Switch
                  value={formData.isPregnant}
                  onValueChange={(val) => setFormData({ ...formData, isPregnant: val })}
                  trackColor={{ false: '#D1DBCE', true: COLORS.secondary }}
                />
              </View>
              
              {formData.isPregnant && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('lmp')} <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={COLORS.textSecondary}
                    value={formData.lmp}
                    onChangeText={(text) => {
                      let cleaned = text.replace(/[^\d/]/g, '');
                      if (cleaned.length === 2 && !formData.lmp?.endsWith('/')) cleaned += '/';
                      else if (cleaned.length === 5 && !formData.lmp?.endsWith('/')) cleaned += '/';
                      setFormData({ ...formData, lmp: cleaned });
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              )}
            </>
          )}

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>{t('knownNcd', 'Known NCD (BP/Sugar/Heart)?')}</Text>
            </View>
            <Switch
              value={formData.hasNcd}
              onValueChange={(val) => setFormData({ ...formData, hasNcd: val })}
              trackColor={{ false: '#D1DBCE', true: COLORS.accent }}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={() => validateAndSave(false)}>
          <Text style={styles.saveButtonText}>{isEdit ? t('updateProfile') : t('saveMember')}</Text>
        </TouchableOpacity>

        {!isEdit && (
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: COLORS.secondary, marginTop: 12 }]} 
            onPress={() => validateAndSave(true)}
          >
            <Text style={styles.saveButtonText}>{t('saveAddAnother')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
          <Text style={[styles.saveButtonText, { color: COLORS.error }]}>{t('cancelBack')}</Text>
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
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    height: 48,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFF',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  saveButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  required: {
    color: COLORS.error,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  switchSubLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default MemberRegistrationScreen;
