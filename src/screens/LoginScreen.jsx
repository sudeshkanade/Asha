import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { db } from '../database/firebaseConfig';
import { collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { cloudSyncManager } from '../database/cloudSync';

const LoginScreen = ({ onLogin }) => {
  const { t, i18n } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminTaps, setAdminTaps] = useState(0);
  const [showHiddenTools, setShowHiddenTools] = useState(false);
  
  const [phcs, setPhcs] = useState([]);
  const [subCenters, setSubCenters] = useState([]);
  const [villages, setVillages] = useState([]);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'ASHA',
    phcId: '',
    subCenterId: '',
    villageId: '',
    ward: '',
  });

  useEffect(() => {
    loadHierarchy();
    // Initial pull to get existing accounts for login
    cloudSyncManager.pullFromCloud().then(() => {
       // Refresh local users list if needed
    });
  }, [isRegister]);

  const loadHierarchy = async () => {
    setLoading(true);
    
    // Auto-pull latest hierarchy & users from cloud
    await cloudSyncManager.pullFromCloud();
    
    const p = await storage.getAll(STORAGE_KEYS.PHCS);
    const s = await storage.getAll(STORAGE_KEYS.SUB_CENTERS);
    const v = await storage.getAll(STORAGE_KEYS.VILLAGES);
    setPhcs(p);
    setSubCenters(s);
    setVillages(v);
    setLoading(false);
  };

  const handleLogin = async () => {
    // Secret shortcut for cleanup: Type 'admin_wipe' in username to reset device
    if (formData.username.toLowerCase() === 'admin_wipe') {
      handleFactoryReset();
      return;
    }

    if (formData.username === 'admin' && formData.password === 'admin') {
      onLogin({ id: 'admin', name: 'Super Admin', role: 'Admin', approvalStatus: 'approved' });
      return;
    }

    setLoading(true);
    await cloudSyncManager.pullFromCloud();
    const users = await storage.getAll(STORAGE_KEYS.USERS);
    const user = users.find(u => u.username === formData.username && u.password === formData.password);
    
    setLoading(false);
    if (user) {
      if (user.approvalStatus === 'approved') {
        onLogin(user);
      } else if (user.approvalStatus === 'rejected') {
        Alert.alert(t('accessDenied'), t('regRejected'));
      } else {
        Alert.alert(t('pendingApproval'), t('regPending'));
      }
    } else {
      Alert.alert(t('error'), t('invalidCredentials'));
    }
  };

  const handleRegister = async () => {
    if (!formData.username || !formData.password || !formData.name) {
      Alert.alert(t('error'), t('fieldsRequired'));
      return;
    }

    if (formData.role === 'ASHA' && (!formData.villageId || !formData.phcId)) {
      Alert.alert(t('error'), t('ashaRequired'));
      return;
    }

    const selectedVillage = villages.find(v => v.id === formData.villageId);
    const selectedSC = subCenters.find(sc => sc.id === formData.subCenterId);
    const selectedPHC = phcs.find(p => p.id === formData.phcId);
    
    const newUser = {
      ...formData,
      id: storage.generateId('user', 'new'),
      approvalStatus: 'pending', // Default status
      village: selectedVillage?.name,
      villageName: selectedVillage?.name,
      subCenterName: selectedSC?.name,
      phcName: selectedPHC?.name,
      phcId: formData.phcId?.toString(),
      subCenterId: formData.subCenterId?.toString(),
      villageId: formData.villageId?.toString(),
    };

    const users = await storage.getAll(STORAGE_KEYS.USERS);
    if (users.find(u => u.username === newUser.username)) {
      Alert.alert(t('error'), t('usernameExists'));
      return;
    }

    await storage.save(STORAGE_KEYS.USERS, newUser);
    await cloudSyncManager.startBackgroundSync();
    
    Alert.alert(t('success'), t('regSubmitted'));
    setIsRegister(false);
  };

  const handleAdminTap = () => {
    const newCount = adminTaps + 1;
    setAdminTaps(newCount);
    if (newCount === 10) {
      setShowHiddenTools(true);
      Alert.alert(t('adminMode'), t('toolsActivated'));
    }
  };

  const handleCloudReset = async () => {
    const performCloudReset = async () => {
      setLoading(true);
      try {
        const collectionsToClear = ['phcs', 'sub_centers', 'villages', 'members', 'families', 'vital_events', 'vhnd_sessions', 'tasks', 'claims'];
        let totalDeleted = 0;

        for (const colName of collectionsToClear) {
          const querySnapshot = await getDocs(collection(db, colName));
          if (querySnapshot.empty) continue;

          // Firestore has a limit of 500 operations per batch
          let batch = writeBatch(db);
          let count = 0;

          for (const docSnap of querySnapshot.docs) {
            batch.delete(doc(db, colName, docSnap.id));
            count++;
            if (count >= 400) {
              await batch.commit();
              batch = writeBatch(db);
              count = 0;
            }
          }
          if (count > 0) await batch.commit();
          totalDeleted += querySnapshot.size;
        }

        await storage.wipeAllData();
        const successMsg = t('cloudWipeSuccess', { count: totalDeleted });
        if (Platform.OS === 'web') {
           window.alert(successMsg);
           window.location.reload();
        } else {
           Alert.alert(t('success'), successMsg);
        }
      } catch (err) {
        if (Platform.OS === 'web') window.alert(t('cloudWipeError'));
        else Alert.alert(t('error'), t('cloudWipeError'));
      } finally {
        setLoading(false);
      }
    };

    if (window.confirm(t('nuclearConfirm'))) {
      if (window.confirm(t('nuclearFinalWarning'))) {
        performCloudReset();
      }
    }
  };

  const handleFactoryReset = async () => {
    const confirmReset = async () => {
      setLoading(true);
      await storage.wipeAllData();
      if (Platform.OS === 'web') window.location.reload();
      else Alert.alert(t('success'), t('factoryResetSuccess'));
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('wipeLocalConfirm'))) {
        confirmReset();
      }
    } else {
      Alert.alert(t('dangerAction'), t('wipeLocalConfirm'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('reset'), style: 'destructive', onPress: confirmReset }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.langToggleContainer}>
        <TouchableOpacity 
          style={styles.langToggle} 
          onPress={() => i18n.changeLanguage(i18n.language === 'en' ? 'mr' : 'en')}
        >
          <Text style={styles.langToggleText}>{i18n.language === 'en' ? 'मराठी' : 'EN'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logoText}>🩺</Text>
          <Text style={styles.title}>{t('title')}</Text>
          <Text style={styles.subtitle}>{isRegister ? t('newWorkerReg') : t('workerLogin')}</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t('username')}
            value={formData.username}
            onChangeText={(t) => setFormData({...formData, username: t})}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder={t('password')}
            value={formData.password}
            onChangeText={(t) => setFormData({...formData, password: t})}
            secureTextEntry
          />

          {isRegister && (
            <>
              <TextInput
                style={styles.input}
                placeholder={t('fullName')}
                value={formData.name}
                onChangeText={(t) => setFormData({...formData, name: t})}
              />
              <Text style={styles.label}>{t('selectRole')}</Text>
              <View style={styles.roleGrid}>
                {['ASHA', 'ANM', 'MO'].map(r => (
                  <TouchableOpacity 
                    key={r}
                    style={[styles.roleBtn, formData.role === r && styles.activeRoleBtn]}
                    onPress={() => setFormData({...formData, role: r})}
                  >
                    <Text style={[styles.roleText, formData.role === r && styles.activeRoleText]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {loading ? <ActivityIndicator color={COLORS.primary} /> : (
                <View style={styles.hierarchySection}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={styles.label}>{t('phc')}</Text>
                    <TouchableOpacity onPress={loadHierarchy}>
                      <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '700' }}>{t('refreshList')}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipGrid}>
                    {phcs.map(p => (
                      <TouchableOpacity 
                        key={p.id}
                        style={[styles.chip, formData.phcId === p.id && styles.activeChip]}
                        onPress={() => setFormData({...formData, phcId: p.id, subCenterId: '', villageId: ''})}
                      >
                        <Text style={[styles.chipText, formData.phcId === p.id && styles.activeChipText]}>{p.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {phcs.length === 0 && <Text style={styles.noData}>{t('noPhcs')}</Text>}
                  </View>

                  {formData.phcId && (
                    <>
                      <Text style={styles.label}>{t('subCenter')}</Text>
                      <View style={styles.chipGrid}>
                        {subCenters.filter(sc => sc.phcId === formData.phcId).map(sc => (
                          <TouchableOpacity 
                            key={sc.id}
                            style={[styles.chip, formData.subCenterId === sc.id && styles.activeChip]}
                            onPress={() => setFormData({...formData, subCenterId: sc.id, villageId: ''})}
                          >
                            <Text style={[styles.chipText, formData.subCenterId === sc.id && styles.activeChipText]}>{sc.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  {formData.subCenterId && (
                    <>
                      <Text style={styles.label}>{t('village')}</Text>
                      <View style={styles.chipGrid}>
                        {villages.filter(v => v.subCenterId === formData.subCenterId).map(v => (
                          <TouchableOpacity 
                            key={v.id}
                            style={[styles.chip, formData.villageId === v.id && styles.activeChip]}
                            onPress={() => setFormData({...formData, villageId: v.id, ward: v.ward})}
                          >
                            <Text style={[styles.chipText, formData.villageId === v.id && styles.activeChipText]}>{v.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              )}
            </>
          )}

          <TouchableOpacity 
            style={styles.mainBtn} 
            onPress={isRegister ? handleRegister : handleLogin}
          >
            <Text style={styles.mainBtnText}>{isRegister ? t('register') : t('login')}</Text>
          </TouchableOpacity>

          {!isRegister && (
            <TouchableOpacity 
              style={[styles.switchBtn, { marginTop: 15 }]} 
              onPress={async () => {
                setLoading(true);
                await cloudSyncManager.pullFromCloud();
                setLoading(false);
                Alert.alert(t('success'), t('accountsSynced'));
              }}
            >
              <Text style={{ color: COLORS.secondary, fontSize: 12, fontWeight: '700' }}>
                ↻ {t('syncAccounts')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.switchBtn}>
            <Text style={styles.switchBtnText}>
              {isRegister ? t('alreadyHaveAccount') : t('newAshaRegister')}
            </Text>
          </TouchableOpacity>
        </View>

        {showHiddenTools && (
          <View style={styles.hiddenTools}>
            <Text style={styles.hiddenToolsTitle}>{t('maintenanceMode')}</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={handleFactoryReset}>
              <Text style={styles.resetBtnText}>{t('wipeLocalData')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resetBtn, { backgroundColor: '#7F1D1D', marginTop: 10 }]} onPress={handleCloudReset}>
              <Text style={styles.resetBtnText}>{t('wipeAllData')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeHiddenBtn} onPress={() => setShowHiddenTools(false)}>
              <Text style={styles.closeHiddenBtnText}>{t('closeTools')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.footer} onPress={handleAdminTap} activeOpacity={1}>
          <Text style={styles.footerText}>{t('systemName')}</Text>
          <Text style={styles.footerSubText}>{t('systemVersion')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 30, justifyContent: 'center', minHeight: '100%' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 50, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  form: { width: '100%' },
  input: { height: 50, backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 16, color: '#000' },
  label: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10, marginTop: 15 },
  roleGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  activeRoleBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleText: { color: '#64748B', fontWeight: '700' },
  activeRoleText: { color: '#FFF' },
  mainBtn: { height: 56, backgroundColor: COLORS.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 20, elevation: 2 },
  mainBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchBtnText: { color: COLORS.primary, fontWeight: '600' },
  footer: { marginTop: 60, alignItems: 'center' },
  footerText: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  footerSubText: { fontSize: 10, color: '#CBD5E1', marginTop: 4 },
  hierarchySection: { marginTop: 10 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  activeChip: { backgroundColor: '#F1F5F9', borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: '#64748B' },
  activeChipText: { color: COLORS.primary, fontWeight: '700' },
  noData: { color: '#EF4444', fontSize: 11, fontStyle: 'italic' },
  langToggleContainer: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  langToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  langToggleText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  hiddenTools: { marginTop: 30, padding: 20, backgroundColor: '#FEF2F2', borderRadius: 12, borderContent: 1, borderColor: '#FCA5A5' },
  hiddenToolsTitle: { fontSize: 14, fontWeight: '800', color: '#B91C1C', marginBottom: 15, textAlign: 'center' },
  resetBtn: { backgroundColor: '#EF4444', padding: 15, borderRadius: 10, alignItems: 'center' },
  resetBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  closeHiddenBtn: { marginTop: 10, padding: 10, alignItems: 'center' },
  closeHiddenBtnText: { color: '#64748B', fontSize: 11, fontWeight: '600' }
});

export default LoginScreen;
