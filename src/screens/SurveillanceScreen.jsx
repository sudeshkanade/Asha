import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  Modal
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { useTranslation } from 'react-i18next';
import { calculateVectorIndices } from '../utils/operationalLogic';

const SurveillanceScreen = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('IDSP');
  const [loading, setLoading] = useState(true);
  const [idspLogs, setIdspLogs] = useState([]);
  const [vectorSurveys, setVectorSurveys] = useState([]);
  const [villages, setVillages] = useState([]);

  // Modal States
  const [showIdspModal, setShowIdspModal] = useState(false);
  const [idspForm, setIdspForm] = useState({ fever: '', diarrhea: '' });
  const [showVectorModal, setShowVectorModal] = useState(false);
  const [vectorForm, setVectorForm] = useState({ houseNo: '', positive: '', checked: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [logs, surveys, vils] = await Promise.all([
      storage.getAll(STORAGE_KEYS.IDSP_SURVEILLANCE),
      storage.getAll(STORAGE_KEYS.VECTOR_SURVEYS),
      storage.getAll(STORAGE_KEYS.VILLAGES),
    ]);
    setIdspLogs(logs);
    setVectorSurveys(surveys);
    setVillages(vils);
    setLoading(false);
  };

  const handleAddIdsp = () => {
    setIdspForm({ fever: '', diarrhea: '' });
    setShowIdspModal(true);
  };

  const saveIdspLog = async () => {
    const { fever, diarrhea } = idspForm;
    if (!fever || !diarrhea || isNaN(fever) || isNaN(diarrhea)) {
      Alert.alert(t('error'), t('invalidInput', 'Please enter valid numbers'));
      return;
    }
    const newLog = {
      id: storage.generateId('idsp', user.id),
      feverCount: parseInt(fever, 10),
      diarrheaCount: parseInt(diarrhea, 10),
      timestamp: new Date().toISOString(),
      villageId: user.villageId,
      ashaId: user.id
    };
    setIdspLogs(prev => [newLog, ...prev]);
    await storage.save(STORAGE_KEYS.IDSP_SURVEILLANCE, newLog);
    setShowIdspModal(false);
    Alert.alert(t('success'), t('weeklyIdspSaved'));
  };

  const handleAddVector = async () => {
    const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
    const villageFamilies = allFamilies.filter(f => f.villageId === user.villageId);
    if (villageFamilies.length === 0) {
      Alert.alert(t('dataMissing'), t('noFamiliesRegistered'));
      return;
    }
    setVectorForm({ houseNo: villageFamilies[0]?.houseNo || '', positive: '', checked: '1' });
    setShowVectorModal(true);
  };

  const saveVectorSurvey = async () => {
    const { houseNo, positive, checked } = vectorForm;
    if (!houseNo || !positive || isNaN(positive) || isNaN(checked)) {
      Alert.alert(t('error'), t('invalidInput', 'Please enter valid inputs'));
      return;
    }
    const newSurvey = {
      id: storage.generateId('vector', user.id),
      houseNo,
      housesChecked: parseInt(checked, 10) || 1,
      positiveHouses: parseInt(positive, 10) || 0,
      timestamp: new Date().toISOString(),
      villageId: user.villageId,
      ashaId: user.id
    };
    setVectorSurveys(prev => [newSurvey, ...prev]);
    await storage.save(STORAGE_KEYS.VECTOR_SURVEYS, newSurvey);
    setShowVectorModal(false);
    Alert.alert(t('success'), t('vectorSurveyRecorded', { houseNo }));
  };

  const indices = calculateVectorIndices(vectorSurveys.map(s => ({
    hasPositiveBreeding: s.positiveHouses > 0,
    containersChecked: s.housesChecked * 2, // approximation
    containersPositive: s.positiveHouses
  })));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('idspSurveillance')}</Text>
      </View>

      <View style={styles.tabContainer}>
        {['IDSP', 'Vector', 'TB/Leprosy'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{t(tab.toLowerCase().replace('/', ''))}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : activeTab === 'IDSP' ? (
          <View>
            <TouchableOpacity style={styles.actionBtn} onPress={handleAddIdsp}>
              <Text style={styles.actionBtnText}>+ {t('addIdspLog', 'Add Weekly IDSP Log')}</Text>
            </TouchableOpacity>
            
            <Text style={styles.sectionTitle}>{t('recentSurveillance', 'Recent Surveillance')}</Text>
            {idspLogs.map(log => (
              <View key={log.id} style={styles.logCard}>
                <View>
                  <Text style={styles.logDate}>{new Date(log.timestamp).toLocaleDateString()}</Text>
                  <Text style={styles.logVillage}>{villages.find(v => v.id === log.villageId)?.name || log.villageId}</Text>
                </View>
                <View style={styles.logStats}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{log.feverCount}</Text>
                    <Text style={styles.statLabel}>{t('fever')}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{log.diarrheaCount}</Text>
                    <Text style={styles.statLabel}>{t('diarrhea')}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : activeTab === 'Vector' ? (
          <View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryVal}>{indices.houseIndex.toFixed(1)}%</Text>
                <Text style={styles.summaryLabel}>{t('houseIndex')}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryVal}>{indices.containerIndex.toFixed(1)}%</Text>
                <Text style={styles.summaryLabel}>{t('containerIndex')}</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]} onPress={handleAddVector}>
              <Text style={styles.actionBtnText}>+ {t('addVectorSurvey', 'Record Vector Survey')}</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>{t('surveyHistory', 'Survey History')}</Text>
            {vectorSurveys.map(survey => (
              <View key={survey.id} style={styles.logCard}>
                <View>
                  <Text style={styles.logDate}>{new Date(survey.timestamp).toLocaleDateString()}</Text>
                  <Text style={styles.logVillage}>Checked: {survey.housesChecked}</Text>
                </View>
                <Text style={[styles.logResult, { color: survey.positiveHouses > 0 ? COLORS.error : COLORS.success }]}>
                  {survey.positiveHouses} {t('positive')}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <Text style={styles.emptyText}>{t('tbLeprosyTracking', 'Long-term Infectious Case Tracking')}</Text>
            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>{t('sputumCollectionTransport')}</Text>
              <Text style={styles.featureDesc}>{t('sputumCollectionTransportDesc')}</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>{t('contactTracing')}</Text>
              <Text style={styles.featureDesc}>{t('contactTracingDesc')}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* IDSP Modal */}
      <Modal visible={showIdspModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('addIdspLog', 'Add Weekly IDSP Log')}</Text>
            
            <Text style={styles.modalLabel}>{t('enterFeverCases')}</Text>
            <TextInput 
              style={styles.modalInput} 
              keyboardType="numeric" 
              value={idspForm.fever} 
              onChangeText={t => setIdspForm(prev => ({...prev, fever: t}))} 
            />

            <Text style={styles.modalLabel}>{t('enterDiarrheaCases')}</Text>
            <TextInput 
              style={styles.modalInput} 
              keyboardType="numeric" 
              value={idspForm.diarrhea} 
              onChangeText={t => setIdspForm(prev => ({...prev, diarrhea: t}))} 
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowIdspModal(false)}>
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveIdspLog}>
                <Text style={styles.modalSaveText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Vector Survey Modal */}
      <Modal visible={showVectorModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('addVectorSurvey', 'Add Vector Survey')}</Text>
            
            <Text style={styles.modalLabel}>{t('houseNo', 'House No')}</Text>
            <TextInput 
              style={styles.modalInput} 
              value={vectorForm.houseNo} 
              onChangeText={t => setVectorForm(prev => ({...prev, houseNo: t}))} 
            />

            <Text style={styles.modalLabel}>{t('housesChecked', 'Houses Checked')}</Text>
            <TextInput 
              style={styles.modalInput} 
              keyboardType="numeric" 
              value={vectorForm.checked} 
              onChangeText={t => setVectorForm(prev => ({...prev, checked: t}))} 
            />

            <Text style={styles.modalLabel}>{t('breedingSitesFound', 'Positive Breeding Sites Found')}</Text>
            <TextInput 
              style={styles.modalInput} 
              keyboardType="numeric" 
              value={vectorForm.positive} 
              onChangeText={t => setVectorForm(prev => ({...prev, positive: t}))} 
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowVectorModal(false)}>
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveVectorSurvey}>
                <Text style={styles.modalSaveText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  actionBtn: {
    backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20,
  },
  actionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  logCard: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 16,
    backgroundColor: '#FFF', borderRadius: 12, marginBottom: 8, elevation: 1,
  },
  logDate: { fontSize: 12, color: COLORS.textSecondary },
  logVillage: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  logStats: { flexDirection: 'row', gap: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, minWidth: 60 },
  statVal: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 10, color: COLORS.textSecondary },
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.primary, padding: 16, borderRadius: 16, alignItems: 'center',
  },
  summaryVal: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  logResult: { fontSize: 16, fontWeight: '800' },
  emptyText: { textAlign: 'center', marginTop: 20, marginBottom: 20, color: COLORS.textSecondary },
  featureCard: {
    backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: COLORS.secondary,
  },
  featureTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  featureDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, color: COLORS.text },
  modalLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16, backgroundColor: '#FAFAFA' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { color: COLORS.error, fontWeight: '700' },
  modalSaveBtn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  modalSaveText: { color: '#FFF', fontWeight: '700' },
});

export default SurveillanceScreen;
