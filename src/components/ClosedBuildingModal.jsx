import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { useTranslation } from 'react-i18next';

const BUILDING_TYPES = [
  'Locked House',
  'Shop',
  'Office',
  'Temple',
  'School',
  'Other'
];

const ClosedBuildingModal = ({ visible, onClose, onSave, defaultVillageId, villages }) => {
  const { t } = useTranslation();
  const [houseNo, setHouseNo] = useState('');
  const [buildingType, setBuildingType] = useState('Locked House');
  const [otherType, setOtherType] = useState('');
  const [villageId, setVillageId] = useState(defaultVillageId || '');

  useEffect(() => {
    if (visible) {
      setHouseNo('');
      setBuildingType('Locked House');
      setOtherType('');
      if (defaultVillageId) {
        setVillageId(defaultVillageId);
      } else if (villages && villages.length > 0) {
        setVillageId(villages[0].id);
      }
    }
  }, [visible, defaultVillageId, villages]);

  const handleSave = () => {
    if (!houseNo.trim()) {
      alert(t('houseNoRequired', 'House number is required'));
      return;
    }
    if (!villageId) {
      alert(t('villageRequired', 'Village selection is required'));
      return;
    }
    
    const finalType = buildingType === 'Other' ? otherType.trim() : buildingType;
    if (!finalType) {
      alert(t('buildingTypeRequired', 'Building type is required'));
      return;
    }

    onSave({ houseNo, buildingType: finalType, villageId });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('markClosedBuilding', 'Mark Closed Building')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {villages && villages.length > 1 && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('village', 'Village')}</Text>
                <View style={styles.chipContainer}>
                  {villages.map(v => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.chip, villageId === v.id && styles.chipActive]}
                      onPress={() => setVillageId(v.id)}
                    >
                      <Text style={[styles.chipText, villageId === v.id && styles.chipTextActive]}>
                        {v.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('houseNo', 'House Number')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('enterHouseNo', 'Enter House Number')}
                placeholderTextColor={COLORS.textSecondary}
                value={houseNo}
                onChangeText={setHouseNo}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('buildingType', 'Building Type')}</Text>
              <View style={styles.chipContainer}>
                {BUILDING_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, buildingType === type && styles.chipActive]}
                    onPress={() => setBuildingType(type)}
                  >
                    <Text style={[styles.chipText, buildingType === type && styles.chipTextActive]}>
                      {t(type.replace(/\s+/g, '').toLowerCase(), type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {buildingType === 'Other' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('specifyOther', 'Please Specify')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('enterBuildingType', 'Enter Building Type')}
                  placeholderTextColor={COLORS.textSecondary}
                  value={otherType}
                  onChangeText={setOtherType}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>{t('cancel', 'Cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{t('save', 'Save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    maxWidth: 500,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 5,
  },
  closeBtnText: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default ClosedBuildingModal;
