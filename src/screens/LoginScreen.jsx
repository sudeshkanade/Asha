import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { db, auth } from '../database/firebaseConfig';
import { collection, doc, getDoc, setDoc, getDocs, query, where, serverTimestamp, deleteDoc, writeBatch } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
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
    email: '',
    password: '',
    name: '',
    role: 'ASHA',
    phcId: '',
    subCenterId: '',
    villageId: '',
    ward: '',
  });

  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationEmail, setMigrationEmail] = useState('');
  const [userToMigrate, setUserToMigrate] = useState(null);
  const [inlineError, setInlineError] = useState('');

  useEffect(() => {
    loadHierarchy();
    // Clear forms on toggle
    setFormData({
      username: '',
      email: '',
      password: '',
      name: '',
      role: 'ASHA',
      phcId: '',
      subCenterId: '',
      villageId: '',
      ward: '',
    });
    setShowMigrationModal(false);
    setUserToMigrate(null);
    setInlineError('');
  }, [isRegister]);

  const loadHierarchy = async () => {
    setLoading(true);

    // BUG-C4 NOTE: This pull is intentionally unauthenticated — it only fetches
    // static hierarchy data (PHCs, sub-centers, villages) for the registration
    // dropdowns. Clinical tables (members, families) are skipped when user=null.
    await cloudSyncManager.pullFromCloud(null, false, 'hierarchy');

    const p = await storage.getAll(STORAGE_KEYS.PHCS);
    const s = await storage.getAll(STORAGE_KEYS.SUB_CENTERS);
    const v = await storage.getAll(STORAGE_KEYS.VILLAGES);
    setPhcs(p);
    setSubCenters(s);
    setVillages(v);
    setLoading(false);
  };

  const handleLogin = async () => {
    setInlineError('');
    setLoading(true);
    try {
      // BUG-H2 FIX: Removed redundant pullFromCloud() here.
      // loadHierarchy() already pulled on mount; post-auth pull (line ~118) handles user-scoped data.
      // The pre-auth pull was causing 3 Firestore pulls on every login attempt (even failed ones).
      const input = formData.username.trim();
      const password = formData.password;

      if (input.includes('@')) {
        // --- EMAIL LOGIN (Firebase Auth) ---
        try {
          const userCredential = await signInWithEmailAndPassword(auth, input, password);
          const uid = userCredential.user.uid;

          // Fetch the user document from Firestore (online first directly by ID, fallback to local cache)
          let user = null;
          try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              user = { id: docSnap.id, ...docSnap.data() };
              await storage.save(STORAGE_KEYS.USERS, user);
            }
          } catch (fetchErr) {
            console.warn("Could not fetch user directly from Firestore:", fetchErr);
          }

          // Fallback to local storage if offline or Firestore fetch failed
          if (!user) {
            const usersList = await storage.getAll(STORAGE_KEYS.USERS);
            user = usersList.find(u => u.uid === uid || u.email === input);
          }

          if (user) {
            if (user.approvalStatus === 'approved') {
              try {
                await storage.purgeOrphanedData(user);
                await cloudSyncManager.pullFromCloud(user);
                await cloudSyncManager.startBackgroundSync();
              } catch (e) {
                console.error("Login Sync Error:", e);
              }
              onLogin(user);
            } else if (user.approvalStatus === 'rejected') {
              Alert.alert(t('accessDenied'), t('regRejected'));
              await auth.signOut();
            } else {
              setInlineError(t('regPending'));
              Alert.alert(t('pendingApproval'), t('regPending'));
              await auth.signOut();
            }
          } else {
            setInlineError(t('noUserRecord', 'User record not found in database. Contact admin.'));
            Alert.alert(t('error'), t('noUserRecord', 'User record not found in database. Contact admin.'));
            await auth.signOut();
          }
        } catch (authError) {
          console.error("Auth Login Error:", authError);
          let errorMsg = t('invalidCredentials');
          if (authError.code === 'auth/user-not-found') {
            errorMsg = t('userNotFound', 'User account not found.');
          } else if (authError.code === 'auth/wrong-password') {
            errorMsg = t('wrongPassword', 'Incorrect password.');
          } else if (authError.code === 'auth/invalid-email') {
            errorMsg = t('invalidEmail', 'Invalid email address format.');
          }
          setInlineError(errorMsg);
          Alert.alert(t('error'), errorMsg);
        }
      } else {
        // --- USERNAME LOGIN (Legacy / Migration) ---
        const usersList = await storage.getAll(STORAGE_KEYS.USERS);
        const user = usersList.find(u => u.username?.toLowerCase() === input.toLowerCase() && u.password === password);

        if (user) {
          if (user.authMigrated || user.email) {
            Alert.alert(
              t('migrationCompleted', 'Account Upgraded'),
              t('useEmailToLogin', `Your account has been secured and upgraded to use email. Please log in using your email address: ${user.email}`)
            );
          } else {
            setUserToMigrate(user);
            setMigrationEmail(user.mobile ? `${user.mobile}@gmail.com` : '');
            setShowMigrationModal(true);
          }
        } else {
          setInlineError(t('invalidCredentials'));
          Alert.alert(t('error'), t('invalidCredentials'));
        }
      }
    } catch (e) {
      console.error("Login Error:", e);
      const msg = e.message || t('loginFailed', 'Login failed. Please check connection.');
      setInlineError(msg);
      Alert.alert(t('error'), msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateUser = async () => {
    setInlineError('');
    if (!migrationEmail || !migrationEmail.includes('@')) {
      setInlineError(t('invalidEmail', 'Please enter a valid email address.'));
      Alert.alert(t('error'), t('invalidEmail', 'Please enter a valid email address.'));
      return;
    }

    setLoading(true);
    setShowMigrationModal(false);

    try {
      const email = migrationEmail.trim();
      const password = userToMigrate.password;
      let uid;

      // 1. Create account in Firebase Auth (or recover if auth exists but local DB wiped)
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            uid = userCredential.user.uid;
          } catch (signInErr) {
            throw authErr; // If sign-in fails, surface the original already-in-use error
          }
        } else {
          throw authErr;
        }
      }

      // 2. Update Firestore record
      await storage.update(STORAGE_KEYS.USERS, (usersList) => {
        const idx = usersList.findIndex(u => u.id === userToMigrate.id);
        if (idx >= 0) {
          usersList[idx].email = email;
          usersList[idx].uid = uid;
          usersList[idx].authMigrated = true;
          usersList[idx].syncStatus = 'pending';
          delete usersList[idx].password;
          usersList[idx].lastUpdatedAt = Date.now();
        }
        return usersList;
      });

      const updatedUser = (await storage.getAll(STORAGE_KEYS.USERS)).find(u => u.id === userToMigrate.id);

      if (updatedUser) {
        await storage.addToSyncQueue(STORAGE_KEYS.USERS, updatedUser);
        await cloudSyncManager.startBackgroundSync();
      }

      Alert.alert(
        t('success'),
        t('migrationSuccess', 'Your account has been secured successfully! In the future, please log in with your email.')
      );

      if (updatedUser.approvalStatus === 'approved') {
        try {
          await storage.purgeOrphanedData(updatedUser);
          await cloudSyncManager.pullFromCloud(updatedUser);
          await cloudSyncManager.startBackgroundSync();
        } catch (e) {
          console.error("Post-migration Sync Error:", e);
        }
        setShowMigrationModal(false);
        setUserToMigrate(null);
        onLogin(updatedUser);
      } else if (updatedUser.approvalStatus === 'rejected') {
        setInlineError(t('regRejected'));
        Alert.alert(t('accessDenied'), t('regRejected'));
        setShowMigrationModal(false);
        setUserToMigrate(null);
        await auth.signOut();
      } else {
        setInlineError(t('regPending'));
        Alert.alert(t('pendingApproval'), t('regPending'));
        setShowMigrationModal(false);
        setUserToMigrate(null);
        await auth.signOut();
      }
    } catch (err) {
      console.error("Migration Error:", err);
      let errorMsg = err.message || t('migrationFailed', 'Migration failed.');
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = t('emailInUse', 'This email address is already in use. Please use a different email.');
      } else if (err.code === 'auth/weak-password') {
        errorMsg = t('weakPassword', 'Your password is too weak. Please contact admin to reset your password.');
      }
      setInlineError(errorMsg);
      Alert.alert(t('error'), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // BUG-C2 FIX: Run all validation BEFORE setLoading(true).
    // Previously, setLoading(true) ran first, and any early-return validation
    // failure (e.g. duplicate email check) never called setLoading(false),
    // leaving the spinner permanently active until force-close.
    if (!formData.email || !formData.password || !formData.name) {
      Alert.alert(t('error'), t('fieldsRequired'));
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert(t('error'), t('invalidEmail', 'Please enter a valid email address.'));
      return;
    }

    if (formData.role === 'ASHA' && (!formData.villageId || !formData.phcId)) {
      Alert.alert(t('error'), t('ashaRequired'));
      return;
    }

    if (formData.role === 'ANM' && !formData.subCenterId) {
      Alert.alert(t('error'), t('subCenterRequired', 'Sub-Center selection is required for ANM.'));
      return;
    }

    if (formData.role === 'MO' && !formData.phcId) {
      Alert.alert(t('error'), t('phcRequired', 'PHC selection is required for MO.'));
      return;
    }

    setLoading(true);

    try {
      const usersList = await storage.getAll(STORAGE_KEYS.USERS);
      // BUG-C2 FIX: This check now runs inside try/finally so setLoading(false)
      // is always called even if we return early here.
      if (usersList.find(u => u.email?.toLowerCase() === formData.email.toLowerCase())) {
        Alert.alert(t('error'), t('emailExists', 'This email address is already registered.'));
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
      const uid = userCredential.user.uid;

      const selectedVillage = villages.find(v => v.id === formData.villageId);
      const selectedSC = subCenters.find(sc => sc.id === formData.subCenterId);
      const selectedPHC = phcs.find(p => p.id === formData.phcId);
      
      const newUser = {
        id: uid,
        uid: uid,
        email: formData.email.trim(),
        username: formData.email.trim(),
        name: formData.name,
        role: formData.role,
        approvalStatus: 'pending', 
        village: selectedVillage?.name || '',
        villageName: selectedVillage?.name || '',
        subCenterName: selectedSC?.name || '',
        phcName: selectedPHC?.name || '',
        phcId: formData.phcId?.toString() || '',
        subCenterId: formData.subCenterId?.toString() || '',
        villageId: formData.villageId?.toString() || '',
        ward: formData.ward || '',
        requestedAt: new Date().toISOString(),
        lastUpdatedAt: Date.now(),
        authMigrated: true
      };

      await storage.save(STORAGE_KEYS.USERS, newUser);
      const syncResult = await cloudSyncManager.startBackgroundSync();
      
      if (syncResult && syncResult.success) {
        Alert.alert(t('pendingApproval'), t('regSubmitted', 'Registration Submitted. Please wait for Admin approval.'));
      } else {
        Alert.alert(
          t('savedLocally', 'Saved Locally'), 
          t('regOffline', 'Saved locally. Please ensure the device connects to the internet soon to submit your registration to the Admin.')
        );
      }
      setIsRegister(false);
    } catch (err) {
      console.error('Registration Error:', err);
      let errorMsg = err.message || t('registrationFailed', 'Registration failed. Please check your connection.');
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = t('emailInUse', 'This email address is already in use. Please use a different email.');
      } else if (err.code === 'auth/weak-password') {
        errorMsg = t('weakPassword', 'Your password is too weak. Please use a stronger password.');
      }
      Alert.alert(t('error'), errorMsg);
    } finally {
      setLoading(false);
    }
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

          // RUTHLESS FIX: Atomic Sync Item Processing with Server-Side Clock Truth
          // (serverTimestamp is now imported at top)
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

    if (Platform.OS === 'web') {
      if (window.confirm(t('nuclearConfirm'))) {
        if (window.confirm(t('nuclearFinalWarning'))) {
          performCloudReset();
        }
      }
    } else {
      Alert.alert(
        t('dangerAction'),
        t('nuclearConfirm'),
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: t('proceed'), 
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                t('finalWarning', 'FINAL WARNING'),
                t('nuclearFinalWarning'),
                [
                  { text: t('cancel'), style: 'cancel' },
                  { text: t('deleteEverything', 'DELETE EVERYTHING'), style: 'destructive', onPress: performCloudReset }
                ]
              );
            }
          }
        ]
      );
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
          <RNText style={styles.langToggleText}>{i18n.language === 'en' ? 'मराठी' : 'EN'}</RNText>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <RNText style={styles.logoText}>🩺</RNText>
          <RNText style={styles.title}>{t('title')}</RNText>
          <RNText style={styles.subtitle}>{isRegister ? t('newWorkerReg') : t('workerLogin')}</RNText>
        </View>

        <View style={styles.form}>
          {isRegister ? (
            <TextInput
              style={styles.input}
              placeholder={t('email', 'Email')}
              value={formData.email}
              onChangeText={(t) => {setFormData({...formData, email: t}); setInlineError(null);}}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder={t('emailOrUsername', 'Email or Username')}
              value={formData.username}
              onChangeText={(t) => {setFormData({...formData, username: t}); setInlineError(null);}}
              autoCapitalize="none"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder={t('password')}
            value={formData.password}
            onChangeText={(t) => {setFormData({...formData, password: t}); setInlineError(null);}}
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
              <RNText style={styles.label}>{t('selectRole')}</RNText>
              <View style={styles.roleGrid}>
                {['ASHA', 'ANM', 'MO'].map(r => (
                  <TouchableOpacity 
                    key={r}
                    style={[styles.roleBtn, formData.role === r && styles.activeRoleBtn]}
                    onPress={() => setFormData({...formData, role: r})}
                  >
                    <RNText style={[styles.roleText, formData.role === r && styles.activeRoleText]}>{r}</RNText>
                  </TouchableOpacity>
                ))}
              </View>

              {loading ? <ActivityIndicator color={COLORS.primary} /> : (
                <View style={styles.hierarchySection}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <RNText style={styles.label}>{t('phc')}</RNText>
                    <TouchableOpacity onPress={loadHierarchy}>
                      <RNText style={{ fontSize: 12, color: COLORS.primary, fontWeight: '700' }}>{t('refreshList')}</RNText>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipGrid}>
                    {phcs.map(p => (
                      <TouchableOpacity 
                        key={p.id}
                        style={[styles.chip, formData.phcId === p.id && styles.activeChip]}
                        onPress={() => setFormData({...formData, phcId: p.id, subCenterId: '', villageId: ''})}
                      >
                        <RNText style={[styles.chipText, formData.phcId === p.id && styles.activeChipText]}>{p.name}</RNText>
                      </TouchableOpacity>
                    ))}
                    {phcs.length === 0 && <RNText style={styles.noData}>{t('noPhcs')}</RNText>}
                  </View>

                  {formData.phcId && (formData.role === 'ASHA' || formData.role === 'ANM') && (
                    <>
                      <RNText style={styles.label}>{t('subCenter')}</RNText>
                      <View style={styles.chipGrid}>
                        {subCenters.filter(sc => sc.phcId === formData.phcId).map(sc => (
                          <TouchableOpacity 
                            key={sc.id}
                            style={[styles.chip, formData.subCenterId === sc.id && styles.activeChip]}
                            onPress={() => setFormData({...formData, subCenterId: sc.id, villageId: ''})}
                          >
                            <RNText style={[styles.chipText, formData.subCenterId === sc.id && styles.activeChipText]}>{sc.name}</RNText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  {formData.subCenterId && formData.role === 'ASHA' && (
                    <>
                      <RNText style={styles.label}>{t('village')}</RNText>
                      <View style={styles.chipGrid}>
                        {villages.filter(v => v.subCenterId === formData.subCenterId).map(v => (
                          <TouchableOpacity 
                            key={v.id}
                            style={[styles.chip, formData.villageId === v.id && styles.activeChip]}
                            onPress={() => setFormData({...formData, villageId: v.id, ward: v.ward})}
                          >
                            <RNText style={[styles.chipText, formData.villageId === v.id && styles.activeChipText]}>{v.name}</RNText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              )}
            </>
          )}

          {inlineError ? <RNText style={{color: 'red', textAlign: 'center', marginBottom: 15, fontWeight: 'bold'}}>{inlineError}</RNText> : null}

          <TouchableOpacity 
            style={[styles.mainBtn, loading && { opacity: 0.7 }]} 
            onPress={isRegister ? handleRegister : handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
                <RNText style={styles.mainBtnText}>{isRegister ? t('sendingRequest', 'Sending Request...') : t('loggingIn', 'Logging in...')}</RNText>
              </View>
            ) : (
              <RNText style={styles.mainBtnText}>{isRegister ? t('register') : t('login')}</RNText>
            )}
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
              <RNText style={{ color: COLORS.secondary, fontSize: 12, fontWeight: '700' }}>
                ↻ {t('syncAccounts')}
              </RNText>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.switchBtn}>
            <RNText style={styles.switchBtnText}>
              {isRegister ? t('alreadyHaveAccount') : t('newAshaRegister')}
            </RNText>
          </TouchableOpacity>
        </View>

        {showHiddenTools && (
          <View style={styles.hiddenTools}>
            <RNText style={styles.hiddenToolsTitle}>{t('maintenanceMode')}</RNText>
            <TouchableOpacity style={styles.resetBtn} onPress={handleFactoryReset}>
              <RNText style={styles.resetBtnText}>{t('wipeLocalData')}</RNText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resetBtn, { backgroundColor: '#7F1D1D', marginTop: 10 }]} onPress={handleCloudReset}>
              <RNText style={styles.resetBtnText}>{t('wipeAllData')}</RNText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeHiddenBtn} onPress={() => setShowHiddenTools(false)}>
              <RNText style={styles.closeHiddenBtnText}>{t('closeTools')}</RNText>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.footer} onPress={handleAdminTap} activeOpacity={1}>
          <RNText style={styles.footerText}>{t('systemName')}</RNText>
          <RNText style={styles.footerSubText}>{t('systemVersion')}</RNText>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showMigrationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowMigrationModal(false);
          setUserToMigrate(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <RNText style={styles.modalTitle}>🔒 {t('secureAccount', 'Secure Your Account')}</RNText>
            <RNText style={styles.modalDescription}>
              {t('migrationExplanation', 'We are upgrading our security system. Please enter your email address to upgrade your account. In the future, you will log in using this email address.')}
            </RNText>
            
            <TextInput
              style={styles.input}
              placeholder={t('email', 'Email')}
              value={migrationEmail}
              onChangeText={setMigrationEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#64748B' }]} 
                onPress={() => {
                  setShowMigrationModal(false);
                  setUserToMigrate(null);
                }}
              >
                <RNText style={styles.modalBtnText}>{t('cancel')}</RNText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: COLORS.primary }]} 
                onPress={handleMigrateUser}
              >
                <RNText style={styles.modalBtnText}>{t('upgrade', 'Upgrade')}</RNText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  closeHiddenBtnText: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default LoginScreen;
