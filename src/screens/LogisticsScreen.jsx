import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  Modal
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { useTranslation } from 'react-i18next';

const LogisticsScreen = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('Stock');
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tempLogs, setTempLogs] = useState([]);
  const [showTempModal, setShowTempModal] = useState(false);
  const [tempInput, setTempInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const stockData = await storage.getAll(STORAGE_KEYS.STOCK);
    const logs = await storage.getAll(STORAGE_KEYS.COLD_CHAIN);
    setStock(stockData);
    setTempLogs(logs);
    setLoading(false);
  };

  const handleUpdateStock = async (item, change) => {
    const currentQty = item.currentQuantity ?? 0;
    const updatedItem = { 
      ...item, 
      currentQuantity: Math.max(0, currentQty + change) 
    };
    
    setStock(prev => prev.map(i => i.id === item.id ? updatedItem : i));
    await storage.save(STORAGE_KEYS.STOCK, updatedItem);
    // BUG-LOG-1 FIX: Add to sync queue so stock changes are pushed to cloud
    await storage.addToSyncQueue(STORAGE_KEYS.STOCK, updatedItem);
  };

  const handleLogTemp = () => {
    setTempInput('');
    setShowTempModal(true);
  };

  const saveTempLog = async () => {
    const temp = tempInput;
    if (!temp || isNaN(temp)) {
      Alert.alert(t('error'), t('invalidInput', 'Please enter a valid temperature'));
      return;
    }

    const newLog = {
      id: storage.generateId('temp', user.id),
      temperature: parseFloat(temp),
      timestamp: new Date().toISOString(), // User/Effective Time
      _recordedAt: new Date().toISOString(), // RUTHLESS AUDIT: Immutable System Time
      user: user.name,
      status: (temp >= 2 && temp <= 8) ? 'Safe' : 'Critical'
    };

    const updatedLogs = [newLog, ...tempLogs];
    setTempLogs(updatedLogs);
    await storage.save(STORAGE_KEYS.COLD_CHAIN, newLog);
    setShowTempModal(false);
    
    if (newLog.status === 'Critical') {
      Alert.alert(t('tempAlertTitle'), t('tempAlertMsg', { temp }));
    } else {
      Alert.alert(t('success'), t('temperatureLogged', 'Temperature logged successfully'));
    }
  };

  const renderStockItem = ({ item }) => {
    // BUG-LOG-2 FIX: Guard against undefined minThreshold/currentQuantity
    const isLow = (item.minThreshold !== undefined) && ((item.currentQuantity ?? 0) <= item.minThreshold);
    return (
      <View style={styles.stockCard}>
        <View style={styles.stockHeader}>
          <Text style={styles.stockName}>{item.name}</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {item.expiryDate && new Date(item.expiryDate) < new Date() && (
              <View style={[styles.badge, { backgroundColor: COLORS.error }]}>
                <Text style={styles.badgeText}>{t('expired')}</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: isLow ? COLORS.error : COLORS.success }]}>
              <Text style={styles.badgeText}>{isLow ? t('lowStock') : t('inStock')}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.stockUnit}>
          {item.batchNo ? `Batch: ${item.batchNo}` : item.unit} 
          {item.expiryDate ? ` • Exp: ${item.expiryDate}` : ''}
        </Text>
        
        <View style={styles.stockActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStock(item, -1)}>
            <Text style={styles.actionBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.stockValue, isLow && { color: COLORS.error }]}>
            {item.currentQuantity}
          </Text>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]} onPress={() => handleUpdateStock(item, 1)}>
            <Text style={styles.actionBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('stockManagement')}</Text>
      </View>

      <View style={styles.tabContainer}>
        {['Stock', 'Cold Chain', 'Indent'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{t(tab.toLowerCase().replace(' ', ''))}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : activeTab === 'Stock' ? (
          <FlatList
            data={stock}
            renderItem={renderStockItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 80 }}
            ListEmptyComponent={<Text style={styles.emptyText}>{t('noStockItems')}</Text>}
          />
        ) : activeTab === 'Cold Chain' ? (
          <ScrollView>
            <TouchableOpacity style={styles.logBtn} onPress={handleLogTemp}>
              <Text style={styles.logBtnText}>🌡️ {t('logTemp', 'Log Temperature')}</Text>
            </TouchableOpacity>
            
            <Text style={styles.sectionTitle}>{t('recentLogs', 'Recent Temperature Logs')}</Text>
            {tempLogs.map(log => (
              <View key={log.id} style={styles.logCard}>
                <View>
                  <Text style={styles.logDate}>{new Date(log.timestamp).toLocaleString()}</Text>
                  <Text style={styles.logUser}>{log.user}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.logTemp, { color: log.status === 'Safe' ? COLORS.success : COLORS.error }]}>
                    {log.temperature}°C
                  </Text>
                  <Text style={styles.logStatus}>{log.status}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>{t('suggestedIndent', 'Suggested Indent')}</Text>
            {stock.filter(i => i.currentQuantity <= i.minThreshold).map(item => (
              <View key={item.id} style={styles.indentRow}>
                <Text style={styles.indentName}>{item.name}</Text>
                <Text style={styles.indentQty}>{item.maxCapacity - item.currentQuantity} {item.unit}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.submitIndentBtn}>
              <Text style={styles.submitIndentText}>{t('submitIndent', 'Submit Indent to PHC')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Temperature Logging Modal */}
      <Modal visible={showTempModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('logTemperature', 'Log ILR Temperature')}</Text>
            
            <Text style={styles.modalLabel}>{t('enterIlrTemp', 'Enter Temperature (°C)')}</Text>
            <TextInput 
              style={styles.modalInput} 
              keyboardType="numeric" 
              value={tempInput} 
              onChangeText={setTempInput} 
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowTempModal(false)}>
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveTempLog}>
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
  stockCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  stockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  stockUnit: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  stockActions: { flexDirection: 'row', alignItems: 'center', marginTop: 16, justifyContent: 'flex-end' },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginHorizontal: 12,
  },
  actionBtnText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  stockValue: { fontSize: 22, fontWeight: '900', color: COLORS.text, minWidth: 40, textAlign: 'center' },
  logBtn: {
    backgroundColor: COLORS.secondary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20,
  },
  logBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  logCard: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 16,
    backgroundColor: '#FFF', borderRadius: 12, marginBottom: 8,
  },
  logDate: { fontSize: 12, color: COLORS.textSecondary },
  logUser: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  logTemp: { fontSize: 20, fontWeight: '900' },
  logStatus: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textSecondary, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, color: COLORS.text },
  modalLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16, backgroundColor: '#FAFAFA' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { color: COLORS.error, fontWeight: '700' },
  modalSaveBtn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  modalSaveText: { color: '#FFF', fontWeight: '700' },
  indentRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  indentName: { fontSize: 15, color: COLORS.text },
  indentQty: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  submitIndentBtn: {
    backgroundColor: COLORS.primary, padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 24,
  },
  submitIndentText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default LogisticsScreen;
