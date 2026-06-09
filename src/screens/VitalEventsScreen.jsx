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
  FlatList,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { incentiveManager } from '../utils/incentiveManager';
import { useTranslation } from 'react-i18next';

const VitalEventsScreen = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [eventType, setEventType] = useState('Birth');
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    gender: 'Male',
    place: 'Hospital',
    // Birth specific
    motherName: '',
    birthWeight: '',
    deliveryType: 'Normal',
    isSBA: false,
    // Death specific
    causeOfDeath: '',
    ageAtDeath: '',
    hospitalName: '',
  });
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadExistingEvents();
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    // Hierarchy filtering
    let filtered = allMembers.filter(m => m.status !== 'Deceased');
    if (user?.role === 'ASHA') {
      const assigned = user.assignedVillages || [];
      const assignedIds = new Set(assigned.map(v => {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object') return v.id || v.villageId;
        return null;
      }).filter(Boolean));
      if (user.villageId) assignedIds.add(user.villageId);

      filtered = filtered.filter(m => m.ashaId === user.id || assignedIds.has(m.villageId));
    } else if (user?.role === 'ANM') {
      filtered = filtered.filter(m => m.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      filtered = filtered.filter(m => m.phcId === user.phcId);
    }
    setMembers(filtered);
  };

  const loadExistingEvents = async () => {
    // FIX: Load from the dedicated VITAL_EVENTS table (not from embedded member.vitalEvents).
    // handleSave stores events in STORAGE_KEYS.VITAL_EVENTS, so this is the correct source.
    const allVitalEvents = await storage.getAll(STORAGE_KEYS.VITAL_EVENTS);
    
    // Hierarchy filtering
    let scopedEvents = allVitalEvents;
    if (user?.role === 'ASHA') {
      const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
      const assigned = user.assignedVillages || [];
      const assignedIds = new Set(assigned.map(v => {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object') return v.id || v.villageId;
        return null;
      }).filter(Boolean));
      if (user.villageId) assignedIds.add(user.villageId);

      const myMemberIds = new Set(
        allMembers.filter(m => m.ashaId === user.id || assignedIds.has(m.villageId)).map(m => m.id)
      );
      scopedEvents = allVitalEvents.filter(e =>
        assignedIds.has(e.villageId) || myMemberIds.has(e.memberId) || myMemberIds.has(e.motherId)
      );
    } else if (user?.role === 'ANM') {
      scopedEvents = allVitalEvents.filter(e => e.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      scopedEvents = allVitalEvents.filter(e => e.phcId === user.phcId);
    }

    setEvents(scopedEvents.sort((a, b) => new Date(b.date) - new Date(a.date)));
  };

  const filteredMembers = members.filter(m =>
    ((m.firstName || '') + ' ' + (m.lastName || '')).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    const showError = (msg) => {
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert(t('error'), msg);
    };

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

    if (!formData.date) {
      showError(t('dateRequired', 'Event date is required.'));
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      showError(t('invalidDateFormat', 'Event date must be in YYYY-MM-DD format.'));
      return;
    }

    const eventDate = parseYyyyMmDd(formData.date);
    if (!eventDate) {
      showError(t('invalidEventDate', 'Invalid event date. Please verify year, month, and day.'));
      return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    if (eventDate > today) {
      showError(t('eventDateInFuture', 'Event date cannot be in the future.'));
      return;
    }

    const diffMs = today - eventDate;
    const diffDays = diffMs / (24 * 60 * 60 * 1000);
    if (diffDays > 365) {
      showError(t('eventDateTooOld', 'Event date cannot be more than 1 year ago.'));
      return;
    }

    if (eventType === 'Birth') {
      if (!formData.name || !formData.name.trim()) {
        showError(t('childNameRequired', 'Child name is required.'));
        return;
      }

      if (!selectedMemberId) {
        showError(t('motherRequired', 'Mother selection is required.'));
        return;
      }

      if (formData.birthWeight) {
        const wt = parseFloat(formData.birthWeight);
        if (isNaN(wt) || wt < 0.5 || wt > 8.0) {
          showError(t('invalidBirthWeight', 'Birth weight must be a valid decimal between 0.5 and 8.0 kg.'));
          return;
        }
      }

      if ((formData.place === 'Hospital' || formData.place === 'Private') && (!formData.hospitalName || !formData.hospitalName.trim())) {
        showError(t('hospitalNameRequired', 'Hospital Name is required for institutional deliveries.'));
        return;
      }
      
      const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
      const mother = allMembers.find(m => m.id === selectedMemberId);
      
      if (!mother) {
        showError(t('motherNotFound', 'Mother not found in register.'));
        return;
      }

      const newEvent = {
        id: storage.generateId('birth', user?.id),
        type: 'Birth',
        date: formData.date,
        name: formData.name,
        gender: formData.gender,
        place: formData.place,
        motherName: mother.firstName + ' ' + mother.lastName,
        motherId: mother.id,
        birthWeight: formData.birthWeight,
        deliveryType: formData.deliveryType,
        hospitalName: formData.hospitalName || '',  // DATA-CLEAN-P1D: was missing from birth event
        isSBA: formData.place === 'Home' ? formData.isSBA : undefined,
        // FIX: Add hierarchy fields so ANM/MO can filter events by their jurisdiction
        villageId: mother.villageId,
        subCenterId: mother.subCenterId,
        phcId: mother.phcId,
        ashaId: mother.ashaId,
      };

      // Create Newborn Member automatically
      const newborn = {
        id: storage.generateId('child', user?.id),
        familyId: mother.familyId,
        houseNo: mother.houseNo,
        villageId: mother.villageId,
        villageName: mother.villageName,
        subCenterId: mother.subCenterId,
        phcId: mother.phcId,
        ashaId: mother.ashaId,
        firstName: formData.name,
        lastName: mother.lastName,
        dob: formData.date,
        age: '0',
        gender: formData.gender,
        relation: 'Child',
        relationToHead: 'Child',
        maritalStatus: 'Unmarried',
        status: 'Active',
        healthData: {
          birthWeight: formData.birthWeight,
          deliveryType: formData.deliveryType,
          placeOfDelivery: formData.place,
          hospitalName: formData.hospitalName,
          vaccinationStatus: 'Started'
        }
      };

      // Update Mother from ANC to PNC
      const updatedMother = {
        ...mother,
        healthData: {
          ...mother.healthData,
          ancStatus: 'Completed',
          pncStatus: 'Pending',
          lastDeliveryDate: formData.date,
          lastDeliveryPlace: formData.place,
          lastDeliveryHospital: formData.hospitalName,
          edd: null, // Clear pregnancy status
          isHighRisk: false 
        }
      };

      await storage.save(STORAGE_KEYS.MEMBERS, newborn);
      await storage.save(STORAGE_KEYS.MEMBERS, updatedMother);
      await storage.save(STORAGE_KEYS.VITAL_EVENTS, newEvent);

      // RED TEAM FIX: Trigger atomic incentive for institutional delivery
      if (user?.role === 'ASHA') {
        await incentiveManager.processEventTriggers(newEvent, user);
      }
      
      Alert.alert(t('success'), `${t('birth')} ${t('success')}`);
    } else {
      if (!selectedMemberId) {
        showError(t('selectMember', 'Please select a member.'));
        return;
      }
      if (!formData.causeOfDeath) {
        showError(t('causeOfDeathRequired', 'Cause of death is required.'));
        return;
      }
      if (formData.ageAtDeath) {
        const age = parseInt(formData.ageAtDeath, 10);
        if (isNaN(age) || age < 0 || age > 125) {
          showError(t('invalidAgeAtDeath', 'Age at death must be a valid integer between 0 and 125.'));
          return;
        }
      }
      const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
      const memberIndex = allMembers.findIndex(m => m.id === selectedMemberId);
      if (memberIndex >= 0) {
        const member = allMembers[memberIndex];
        // FIX: Use spread to avoid direct mutation of the member object before save
        const updatedMember = {
          ...member,
          status: 'Deceased',
          deathDate: formData.date,
          causeOfDeath: formData.causeOfDeath,
        };
        
        const deathEvent = {
          id: storage.generateId('death', user?.id),
          type: 'Death',
          date: formData.date,
          memberId: member.id,
          name: member.firstName + ' ' + member.lastName,
          ageAtDeath: member.age || formData.ageAtDeath || 'N/A',
          causeOfDeath: formData.causeOfDeath,
          // DATA-CLEAN-P1B: Add ashaId so death events are returned by ASHA cloud pull ashaId query
          ashaId: member.ashaId,
          // Carry hierarchy fields so the events are filterable by role
          villageId: member.villageId,
          subCenterId: member.subCenterId,
          phcId: member.phcId,
        };

        await storage.save(STORAGE_KEYS.MEMBERS, updatedMember);
        await storage.save(STORAGE_KEYS.VITAL_EVENTS, deathEvent);
        
        Alert.alert(t('success'), `${t('death')} ${t('success')}`);
      }
    }
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0], name: '', gender: 'Male', place: 'Hospital',
      motherName: '', birthWeight: '', deliveryType: 'Normal', causeOfDeath: '', ageAtDeath: '', hospitalName: '',
    });
    setSelectedMemberId(null);
    setSearchQuery('');
    loadExistingEvents();
    loadMembers();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t('vitalEvents')}</Text>
          <Text style={styles.headerSubtitle}>{t('birthDeathRecords', 'Village Birth & Death Records')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Event Type Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('eventType')}</Text>
          <View style={styles.typeRow}>
            {['Birth', 'Death'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.typeBtn, eventType === type && styles.typeBtnActive]}
                onPress={() => setEventType(type)}
              >
                <Text style={[styles.typeBtnText, eventType === type && styles.typeBtnTextActive]}>
                  {type === 'Birth' ? '👶 ' + t('birth') : '🕊️ ' + t('death')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{eventType === 'Birth' ? t('birth') + ' ' + t('eventDetails') : t('death') + ' ' + t('eventDetails')}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('visitDate')} <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={formData.date}
              onChangeText={(t) => setFormData({ ...formData, date: t })}
              placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textSecondary} />
          </View>

          {eventType === 'Birth' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('childName')} <Text style={styles.required}>*</Text></Text>
                <TextInput style={styles.input} value={formData.name}
                  onChangeText={(t) => setFormData({ ...formData, name: t })}
                  placeholder="Newborn Name" placeholderTextColor={COLORS.textSecondary} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('gender')}</Text>
                <View style={styles.chipRow}>
                  {['Male', 'Female'].map(g => (
                    <TouchableOpacity key={g}
                      style={[styles.chip, formData.gender === g && styles.chipActive]}
                      onPress={() => setFormData({ ...formData, gender: g })}>
                      <Text style={[styles.chipText, formData.gender === g && styles.chipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('selectFromRegister')} ({t('motherName')}) <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search mother..."
                  placeholderTextColor={COLORS.textSecondary}
                />
                {searchQuery.length > 0 && (
                  <View style={styles.memberList}>
                    {filteredMembers.filter(m => m.gender === 'Female').slice(0, 5).map(m => (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.memberItem, selectedMemberId === m.id && styles.memberItemActive]}
                        onPress={() => { setSelectedMemberId(m.id); setSearchQuery(m.firstName + ' ' + m.lastName); }}
                      >
                        <Text style={styles.memberItemText}>{m.firstName} {m.lastName} • Age {m.age}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, minWidth: 150 }]}>
                  <Text style={styles.label}>{t('birthWeight')}</Text>
                  <TextInput style={styles.input} value={formData.birthWeight}
                    onChangeText={(t) => setFormData({ ...formData, birthWeight: t })}
                    placeholder="2.5" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" />
                </View>
                <View style={[styles.inputGroup, { flex: 1, minWidth: 150 }]}>
                  <Text style={styles.label}>{t('placeOfDelivery')}</Text>
                  <View style={styles.chipRow}>
                    {['Hospital', 'Private', 'Home'].map(p => (
                      <TouchableOpacity key={p}
                        style={[styles.chip, formData.place === p && styles.chipActive]}
                        onPress={() => setFormData({ ...formData, place: p })}>
                        <Text style={[styles.chipText, formData.place === p && styles.chipTextActive]}>{t(p.toLowerCase()) || p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {(formData.place === 'Hospital' || formData.place === 'Private') && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('hospitalName')}</Text>
                  <TextInput 
                    style={styles.input} 
                    value={formData.hospitalName}
                    onChangeText={(t) => setFormData({ ...formData, hospitalName: t })}
                    placeholder={t('enterHospitalName', 'Enter Hospital Name')} 
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('deliveryType')}</Text>
                <View style={styles.chipRow}>
                  {['Normal', 'C-Section', 'Assisted'].map(d => (
                    <TouchableOpacity key={d}
                      style={[styles.chip, formData.deliveryType === d && styles.chipActive]}
                      onPress={() => setFormData({ ...formData, deliveryType: d })}>
                      <Text style={[styles.chipText, formData.deliveryType === d && styles.chipTextActive]}>{t(d.toLowerCase().replace('-', '')) || d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {formData.place === 'Home' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('attendedBySBA', 'Attended by Skilled Birth Attendant (SBA)?')}</Text>
                  <View style={styles.chipRow}>
                    <TouchableOpacity style={[styles.chip, formData.isSBA && styles.chipActive]} onPress={() => setFormData({ ...formData, isSBA: true })}>
                      <Text style={[styles.chipText, formData.isSBA && styles.chipTextActive]}>{t('yes')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.chip, !formData.isSBA && styles.chipActive]} onPress={() => setFormData({ ...formData, isSBA: false })}>
                      <Text style={[styles.chipText, !formData.isSBA && styles.chipTextActive]}>{t('no')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('selectFromRegister')}</Text>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search member..."
                  placeholderTextColor={COLORS.textSecondary}
                />
                {searchQuery.length > 0 && (
                  <View style={styles.memberList}>
                    {filteredMembers.slice(0, 5).map(m => (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.memberItem, selectedMemberId === m.id && styles.memberItemActive]}
                        onPress={() => { setSelectedMemberId(m.id); setSearchQuery(m.firstName + ' ' + m.lastName); }}
                      >
                        <Text style={styles.memberItemText}>{m.firstName} {m.lastName} • {m.gender} • Age {m.age}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('causeOfDeath')}</Text>
                <View style={styles.chipRow}>
                  {['oldAge', 'accident', 'disease', 'heartAttack', 'maternalDeath', 'infantDeath', 'other'].map(c => (
                    <TouchableOpacity key={c}
                      style={[styles.chip, formData.causeOfDeath === c && styles.chipActive]}
                      onPress={() => setFormData({ ...formData, causeOfDeath: c })}>
                      <Text style={[styles.chipText, formData.causeOfDeath === c && styles.chipTextActive]}>{t(c)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('ageAtDeath', 'Age at Death')}</Text>
                <TextInput style={styles.input} value={formData.ageAtDeath}
                  onChangeText={(t) => setFormData({ ...formData, ageAtDeath: t })}
                  placeholder={t('autoFilled', 'Auto-filled from register')}
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric" />
              </View>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('registerEvent')} {eventType === 'Birth' ? t('birth') : t('death')}</Text>
        </TouchableOpacity>

        {/* Recent Events */}
        {events.length > 0 && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>{t('recentEvents')}</Text>
            {events.slice(-5).reverse().map((e, i) => (
              <View key={i} style={styles.eventRow}>
                <Text style={styles.eventIcon}>{e.type === 'Birth' ? '👶' : '🕊️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{e.memberName || e.name}</Text>
                  <Text style={styles.eventDate}>{e.date} • {e.type === 'Birth' ? t('birth') : t('death')}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.whatsappBtn}
                  onPress={() => {
                    const msg = e.type === 'Birth' 
                      ? t('newBirthRegNotify', { name: e.name || e.memberName, motherName: e.motherName || t('unknown'), date: e.date })
                      : t('newDeathRegNotify', { name: e.name || e.memberName, date: e.date, cause: e.causeOfDeath || t('unknown') });
                    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
                  }}
                >
                  <Text style={styles.whatsappIcon}>💬</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
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
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: '#F0F4FF' },
  typeBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  typeBtnTextActive: { color: COLORS.primary },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  required: { color: COLORS.error },
  input: { height: 48, backgroundColor: '#FAFAFA', borderRadius: 8, paddingHorizontal: 12, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFF' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textSecondary },
  chipTextActive: { color: '#FFF', fontWeight: '600' },
  searchInput: { height: 48, backgroundColor: '#FAFAFA', borderRadius: 8, paddingHorizontal: 12, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, marginBottom: 4 },
  memberList: { backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8 },
  memberItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  memberItemActive: { backgroundColor: '#F0F4FF' },
  memberItemText: { fontSize: 13, color: COLORS.text },
  saveButton: { height: 52, backgroundColor: COLORS.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  eventIcon: { fontSize: 20, marginRight: 12 },
  eventName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  eventDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  whatsappBtn: { marginLeft: 10, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  whatsappIcon: { fontSize: 16 },
});

export default VitalEventsScreen;
