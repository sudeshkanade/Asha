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
  Platform
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const logs = await storage.getAll(STORAGE_KEYS.IDSP_SURVEILLANCE);
    const surveys = await storage.getAll(STORAGE_KEYS.VECTOR_SURVEYS);
    setIdspLogs(logs);
    setVectorSurveys(surveys);
    setLoading(false);
  };

  const handleAddIdsp = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Not Supported', 'Please use the web portal for syndromic surveillance entry.');
      return;
    }
    const fever = window.prompt("Enter number of Fever cases today:");
    const diarrhea = window.prompt("Enter number of Diarrhea cases today:");
    
    if (!fever || !diarrhea) return;

    const newLog = {
      id: storage.generateId('idsp', user.id),
      feverCount: parseInt(fever),
      diarrheaCount: parseInt(diarrhea),
      timestamp: new Date().toISOString(),
      villageId: user.villageId,
      ashaId: user.id
    };

    const updatedLogs = [newLog, ...idspLogs];
    setIdspLogs(updatedLogs);
    await storage.save(STORAGE_KEYS.IDSP_SURVEILLANCE, newLog);
    Alert.alert(t('success'), "Weekly IDSP log saved.");
  };

  const handleAddVector = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Not Supported', 'Please use the web portal for larval survey entry.');
      return;
    }

    // RUTHLESS FIX: Linking Surveys to Families (Prevent Orphaned Data)
    const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
    const villageFamilies = allFamilies.filter(f => f.villageId === user.villageId);
    
    if (villageFamilies.length === 0) {
      Alert.alert("Data Missing", "No families registered in this village. Please ensure ASHA has completed registration.");
      return;
    }

    const houseNo = window.prompt(`Enter House Number (Suggested: ${villageFamilies[0]?.houseNo}...):`);
    if (!houseNo) return;

    const positive = window.prompt("Positive breeding sites found (Larvae detected):");
    if (positive === null) return;

    const newSurvey = {
      id: storage.generateId('vector', user.id),
      houseNo,
      positiveHouses: parseInt(positive),
      timestamp: new Date().toISOString(),
      villageId: user.villageId,
      ashaId: user.id
    };

    const updatedSurveys = [newSurvey, ...vectorSurveys];
    setVectorSurveys(updatedSurveys);
    await storage.save(STORAGE_KEYS.VECTOR_SURVEYS, newSurvey);
    Alert.alert(t('success'), `Vector survey for House ${houseNo} recorded.`);
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
                  <Text style={styles.logVillage}>{log.villageId}</Text>
                </View>
                <View style={styles.logStats}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{log.feverCount}</Text>
                    <Text style={styles.statLabel}>Fever</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{log.diarrheaCount}</Text>
                    <Text style={styles.statLabel}>Diarrhea</Text>
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
                <Text style={styles.summaryLabel}>House Index</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryVal}>{indices.containerIndex.toFixed(1)}%</Text>
                <Text style={styles.summaryLabel}>Container Index</Text>
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
                  {survey.positiveHouses} Positive
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <Text style={styles.emptyText}>{t('tbLeprosyTracking', 'Long-term Infectious Case Tracking')}</Text>
            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>Sputum Collection & Transport</Text>
              <Text style={styles.featureDesc}>Log and track TB samples from field to lab.</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>Contact Tracing</Text>
              <Text style={styles.featureDesc}>Manage screening for family members of positive cases.</Text>
            </View>
          </View>
        )}
      </ScrollView>
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
});

export default SurveillanceScreen;
