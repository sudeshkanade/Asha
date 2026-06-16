import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text as RNText, 
  TouchableOpacity, 
  Platform, 
  Alert, 
  ActivityIndicator, 
  SafeAreaView, 
  ScrollView, 
  Modal 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import DailyTaskListScreen from './src/screens/DailyTaskListScreen';
import FamilyRegistrationScreen from './src/screens/FamilyRegistrationScreen';
import MemberRegistrationScreen from './src/screens/MemberRegistrationScreen';
import MemberListScreen from './src/screens/MemberListScreen';
import HealthTrackerScreen from './src/screens/HealthTrackerScreen';
import VitalEventsScreen from './src/screens/VitalEventsScreen';
import VHNDScreen from './src/screens/VHNDScreen';
import ClaimsScreen from './src/screens/ClaimsScreen';
import TeamScreen from './src/screens/TeamScreen';
import FamilyFolderScreen from './src/screens/FamilyFolderScreen';
import LogisticsScreen from './src/screens/LogisticsScreen';
import SurveillanceScreen from './src/screens/SurveillanceScreen';
import WorkplanScreen from './src/screens/WorkplanScreen';
import FinancialsScreen from './src/screens/FinancialsScreen';

const GoshwaraReportScreen = React.lazy(() => import('./src/screens/GoshwaraReportScreen'));
const MPRReportScreen = React.lazy(() => import('./src/screens/MPRReportScreen'));
const AdminSetupScreen = React.lazy(() => import('./src/screens/AdminSetupScreen'));
const AdminSettingsScreen = React.lazy(() => import('./src/screens/AdminSettingsScreen'));
const MODashboard = React.lazy(() => import('./src/screens/MODashboard'));
const AdminDashboard = React.lazy(() => import('./src/screens/AdminDashboard'));
import { storage, STORAGE_KEYS } from './src/database/storage';
import { cloudSyncManager } from './src/database/cloudSync';
import './src/locales/i18n';

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Login');
  const [user, setUser] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [navigationHistory, setNavigationHistory] = useState([{ screen: 'Login', data: null }]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [currentFilter, setCurrentFilter] = useState(null);
  const [familyIdFilter, setFamilyIdFilter] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [registrationKey, setRegistrationKey] = useState(1);
  const [initError, setInitError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminSetupData, setAdminSetupData] = useState(null);


  // BUG-FIX: Use a ref to always access the latest user inside effects without
  // re-registering intervals on every user state change (which caused leaks).
  const userRef = React.useRef(user);
  React.useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    const APP_VERSION = '1.2.0';
    
    const initApp = async () => {
      let restoredUser = null;
      try {
        const storedUserStr = await AsyncStorage.getItem('LOGGED_IN_USER');
        if (storedUserStr) {
          restoredUser = JSON.parse(storedUserStr);
          setUser(restoredUser);
          userRef.current = restoredUser;
          const homeScreen = restoredUser.role === 'Admin' ? 'AdminDashboard' : (restoredUser.role === 'MO' ? 'MODashboard' : 'Dashboard');
          setNavigationHistory([{ screen: homeScreen, data: null }]);
          setCurrentScreen(homeScreen);
        }
      } catch (e) {
        console.warn('Session restore failed:', e);
      }

      // BUG-03 FIX: Only reload if localVersion already exists (skip first-run to prevent loop)
      try {
        const lastCheck = await AsyncStorage.getItem('LAST_VERSION_CHECK') || 0;
        const now = Date.now();
        
        if (now - parseInt(lastCheck) > 14400000) {
          // Use a relative URL (no leading slash) so it works on GitHub Pages sub-paths like /Asha/
          const response = await fetch('version.json?t=' + now);
          if (!response.ok) throw new Error('version.json not found (' + response.status + ')');
          const serverVersion = await response.json();
          const localVersion = await AsyncStorage.getItem('APP_VERSION');
          
          await AsyncStorage.setItem('LAST_VERSION_CHECK', now.toString());
          await AsyncStorage.setItem('APP_VERSION', serverVersion.version);

          // BUG-03: Only reload when localVersion existed AND differs (not on first install)
          if (localVersion && serverVersion.version !== localVersion) {
            console.log('🔄 New version detected. Reloading...');
            if (Platform.OS === 'web') window.location.reload(true);
            return;
          }
        }
      } catch (e) {
        console.warn('⚠️ Version check skipped (Offline/Throttle)');
      }

      try {
        await storage.init();
        await storage.cleanupTombstones();
      } catch (e) {
        console.error('FATAL: Storage init failed', e);
        setInitError(true);
        setLoading(false);
        return;
      }

      try {
        await storage.autoPrune();
        // QUOTA FIX: Only pull once on startup (cooldown guard inside pullFromCloud prevents repeated calls).
        // The periodic interval below handles subsequent refreshes at a safe 30-minute cadence.
        await cloudSyncManager.pullFromCloud(restoredUser);
        await cloudSyncManager.startBackgroundSync();
        await storage.purgeOrphanedData(restoredUser);
      } catch (syncError) {
        console.error("Initial app load sequence failed, proceeding offline:", syncError);
      } finally {
        setLoading(false);
      }
    };

    initApp().catch(err => console.error("App Init Crash:", err));

    // Security Heartbeat (reads user from ref to avoid stale closure)
    const securityCheck = async () => {
      const currentUser = userRef.current;
      if (!currentUser || currentUser.id === 'admin') return;
      
      const allUsers = await storage.getAll(STORAGE_KEYS.USERS);
      const dbUser = allUsers.find(u => u.id === currentUser.id);
      
      if (!dbUser || dbUser.approvalStatus !== 'approved') {
        console.warn("Security: User no longer approved. Forcing logout.");
        setUser(null);
        setCurrentScreen('Login');
      }
    };

    const heartbeatId = setInterval(securityCheck, 30 * 1000);

    // QUOTA FIX: Reduced from 5 minutes to 30 minutes to prevent Firestore read quota exhaustion.
    // The cooldown guard inside pullFromCloud also enforces a minimum 15-minute gap as a safety net.
    const periodicPullId = setInterval(async () => {
      const currentUser = userRef.current;
      if (!currentUser) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      try {
        await cloudSyncManager.pullFromCloud(currentUser); // respects cooldown guard automatically
      } catch (e) {
        console.warn('Periodic pull failed (offline?):', e.message);
      }
    }, 30 * 60 * 1000);

    // BUG-02 FIX: Guard against null user in inactivity handler
    const handleVisibilityChange = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        // BUG-02: Don't fire session-expired alert when no user is logged in
        const activeUser = userRef.current;
        const now = Date.now();
        const lastActive = await storage.getRaw('LAST_ACTIVE_TIME');
        
        if (activeUser && lastActive && (now - parseInt(lastActive)) > 30 * 60 * 1000) {
          console.warn("Security: Session expired due to inactivity.");
          setUser(null);
          setCurrentScreen('Login');
          Alert.alert("Session Expired", "For your security, you have been logged out due to inactivity.");
        }
        storage.saveRaw('LAST_ACTIVE_TIME', now.toString());
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      clearInterval(heartbeatId);
      clearInterval(periodicPullId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  // BUG-01 FIX: Run once on mount only. userRef keeps effects fresh without re-registering intervals.
  }, []);

  if (initError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        <RNText style={{ fontSize: 40, marginBottom: 20 }}>🏥</RNText>
        <RNText style={{ fontSize: 20, fontWeight: '800', color: '#1E293B', textAlign: 'center' }}>System Recovery Mode</RNText>
        <RNText style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginVertical: 15 }}>
          The local database could not be loaded. This usually happens if device storage is full.
        </RNText>
        <TouchableOpacity 
          style={{ backgroundColor: '#EF4444', padding: 16, borderRadius: 12, width: '100%' }}
          onPress={async () => {
             await storage.clearAll();
             if (typeof window !== 'undefined') window.location.reload();
          }}
        >
          <RNText style={{ color: '#FFF', fontWeight: '700', textAlign: 'center' }}>FORCE RESET APP (Wipes Local Data)</RNText>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => { if (typeof window !== 'undefined') window.location.reload(); }}>
          <RNText style={{ color: '#0F172A', fontWeight: '600' }}>Retry Initialization</RNText>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !user) {
    return (
       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
         <RNText style={{fontSize: 24, fontWeight: '800', color: '#0F172A'}}>RHT Operating System</RNText>
         <RNText style={{fontSize: 12, color: '#64748B', marginTop: 8}}>Booting Clinical Engine...</RNText>
       </View>
    );
  }

  const getHomeScreen = (u) => {
    if (!u) return 'Login';
    if (u.role === 'Admin') return 'AdminDashboard';
    if (u.role === 'MO') return 'MODashboard';
    return 'Dashboard';
  };

  const handleNavigate = (screen, data) => {
    if (screen === 'Login') {
      // Clear all state on logout
      setUser(null);
      setSelectedMember(null);
      setSelectedFamily(null);
      setCurrentFilter(null);
      setFamilyIdFilter(null);
      setAdminSetupData(null);
      AsyncStorage.removeItem('LOGGED_IN_USER').catch(err => console.warn(err));
      setNavigationHistory([{ screen: 'Login', data: null }]);
      setCurrentScreen('Login');
      return;
    }
    if (data?.member) setSelectedMember(data.member);
    if (data?.family) setSelectedFamily(data.family);
    if (data?.taskId) setSelectedTaskId(data.taskId);
    else setSelectedTaskId(null);
    // BUG-NAV-01 FIX: Accept both 'filter' and 'filterType' keys from callers (DashboardScreen uses filterType)
    const resolvedFilter = data?.filterType || data?.filter || null;
    setCurrentFilter(resolvedFilter);
    if (data?.familyId) setFamilyIdFilter(data.familyId);
    else setFamilyIdFilter(null);
    if (data?.initialTab) setAdminSetupData(data.initialTab);
    else setAdminSetupData(null);

    setNavigationHistory(prev => [...prev, {
      screen,
      data: {
        member: data?.member || null,
        family: data?.family || null,
        taskId: data?.taskId || null,
        filter: resolvedFilter,
        familyId: data?.familyId || null,
        initialTab: data?.initialTab || null
      }
    }]);

    setCurrentScreen(screen);
  };

  const handleGoBack = () => {
    if (navigationHistory.length > 1) {
      const updatedHistory = [...navigationHistory];
      updatedHistory.pop(); // Remove current screen
      const previousState = updatedHistory[updatedHistory.length - 1];
      
      // Restore contexts from previous state
      const data = previousState.data;
      setSelectedMember(data?.member || null);
      setSelectedFamily(data?.family || null);
      setSelectedTaskId(data?.taskId || null);
      setCurrentFilter(data?.filter || null);
      setFamilyIdFilter(data?.familyId || null); // BUG-STATE-03 FIX: always restore, not conditionally
      setAdminSetupData(data?.initialTab || null);
      
      setNavigationHistory(updatedHistory);
      setCurrentScreen(previousState.screen);
    } else {
      setCurrentScreen(getHomeScreen(user));
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    AsyncStorage.setItem('LOGGED_IN_USER', JSON.stringify(userData)).catch(err => console.warn(err));
    const homeScreen = userData.role === 'Admin' ? 'AdminDashboard' : (userData.role === 'MO' ? 'MODashboard' : 'Dashboard');
    setNavigationHistory([{ screen: homeScreen, data: null }]);
    setCurrentScreen(homeScreen);
  };

  const handleFamilySave = async (familyData) => {
    const isEdit = !!selectedFamily;
    const finalFamily = {
      ...selectedFamily,
      ...familyData,
      ashaId: familyData.ashaId || selectedFamily?.ashaId || user?.id,
      id: familyData.id || selectedFamily?.id || storage.generateId('fam', user?.id || 'sys'),
    };
    await storage.save(STORAGE_KEYS.FAMILIES, finalFamily);
    if (isEdit) {
      setSelectedFamily(null);
      handleGoBack();
    } else {
      setSelectedFamily(finalFamily);
      setCurrentScreen('MemberRegistration');
    }
  };

  const handleMemberSave = async (memberData, addAnother = false) => {
    // FIX A1: Map 'relation' field to 'relationToHead' for all downstream consumers
    const { relation, ...restMemberData } = memberData;
    const finalMember = {
      ...selectedMember, // Preserve existing IDs and metadata
      ...restMemberData,
      relation: relation,
      relationToHead: relation,
      id: selectedMember?.id || storage.generateId('mem', user?.id || 'sys'),
      familyId: selectedFamily?.id || selectedMember?.familyId,
      houseNo: selectedFamily?.houseNo || selectedMember?.houseNo,
      status: selectedMember?.status || 'Active',
      // Hierarchy Preservation Logic:
      // 1. If worker is ASHA, use her IDs
      // 2. If worker is ANM/MO and member already has IDs, keep them
      // 3. Fallback to family IDs
      ashaId: selectedFamily?.ashaId || (user?.role === 'ASHA' ? user.id : selectedMember?.ashaId) || user?.id,
      villageId: selectedFamily?.villageId || (user?.role === 'ASHA' ? user.villageId : selectedMember?.villageId) || user?.villageId,
      subCenterId: selectedFamily?.subCenterId || (user?.role === 'ANM' ? user.subCenterId : selectedMember?.subCenterId) || user?.subCenterId,
      phcId: selectedFamily?.phcId || selectedMember?.phcId || user?.phcId,
      lastUpdatedAt: new Date().getTime()
    };
    
    await storage.save(STORAGE_KEYS.MEMBERS, finalMember);

    // Sync Head Name to Family Record
    if (finalMember.relationToHead === 'Self (Head)' || finalMember.relationToHead === 'head' || !selectedFamily?.headName) {
      const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
      const famIndex = allFamilies.findIndex(f => f.id === finalMember.familyId);
      if (famIndex >= 0) {
        const family = allFamilies[famIndex];
        family.headName = `${finalMember.firstName} ${finalMember.lastName}`;
        await storage.save(STORAGE_KEYS.FAMILIES, family);
      }
    }

    if (addAnother) {
      setSelectedMember(null);
      setRegistrationKey(prev => prev + 1);
      // Stay on the MemberRegistration screen
    } else {
      setSelectedMember(null);
      setSelectedFamily(null);
      handleGoBack(); // BUG-NAV-02 FIX: use history pop, not direct home redirect
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Login':
        return <LoginScreen onLogin={handleLogin} />;
      case 'Dashboard':
        return <DashboardScreen 
                 user={user} 
                 onNavigate={handleNavigate} 
               />;
      case 'Tasks':
        return <DailyTaskListScreen user={user} villageName={user?.village} onBack={handleGoBack} />;
      case 'FamilyFolder':
        return <FamilyFolderScreen user={user} onNavigate={handleNavigate} onBack={handleGoBack} />;
      case 'FamilyRegistration':
        return <FamilyRegistrationScreen onSave={handleFamilySave} user={user} onBack={handleGoBack} existingFamily={selectedFamily} />;
      case 'MemberRegistration':
        return <MemberRegistrationScreen key={`reg-${registrationKey}`} familyHead={selectedFamily} existingMember={selectedMember} onSave={handleMemberSave} onBack={handleGoBack} />;
      case 'MPRReport':
        return <MPRReportScreen user={user} onBack={handleGoBack} />;
      case 'MemberList':
        return <MemberListScreen 
                  user={user}
                  filterType={currentFilter} 
                  familyId={familyIdFilter}
                  onMemberSelect={(member) => {
                    if (member) {
                      // BUG-NAV-03 FIX: use handleNavigate to push HealthTracker onto history stack
                      handleNavigate('HealthTracker', { member });
                    }
                  }}
                  onNavigate={handleNavigate}
                  onBack={handleGoBack} 
                />;
      case 'GoshwaraReport':
        return <GoshwaraReportScreen user={user} onBack={handleGoBack} />;
      case 'AdminSetup':
        return <AdminSetupScreen user={user} initialTab={adminSetupData} onBack={handleGoBack} />;
      case 'HealthTracker':
        return <HealthTrackerScreen 
                  user={user}
                  member={selectedMember} 
                  taskId={selectedTaskId}
                  onSave={(updatedMember) => {
                    setSelectedMember(null);
                    setSelectedTaskId(null);
                    handleGoBack();
                  }}
                  onBack={() => {
                    setSelectedTaskId(null);
                    handleGoBack();
                  }} 
                />;
      case 'VitalEvents':
        return <VitalEventsScreen user={user} onBack={handleGoBack} />;
      case 'VHND':
        return <VHNDScreen user={user} onBack={handleGoBack} />;
      case 'Claims':
        return <ClaimsScreen user={user} onBack={handleGoBack} />;
      case 'Team':
        return <TeamScreen user={user} onBack={handleGoBack} />;
      case 'RateSettings':
        return <AdminSettingsScreen user={user} onBack={handleGoBack} />;
      case 'Logistics':
        return <LogisticsScreen user={user} onBack={handleGoBack} />;
      case 'Surveillance':
        return <SurveillanceScreen user={user} onBack={handleGoBack} />;
      case 'Workplan':
        return <WorkplanScreen user={user} onBack={handleGoBack} onNavigate={handleNavigate} />;
      case 'MODashboard':
        return <MODashboard user={user} onBack={handleGoBack} onNavigate={handleNavigate} />;
      case 'AdminDashboard':
        return <AdminDashboard user={user} onBack={handleGoBack} onNavigate={handleNavigate} />;
      case 'Financials':
        return <FinancialsScreen user={user} onBack={handleGoBack} onNavigate={handleNavigate} />;
      default:
        return <DashboardScreen user={user} onNavigate={handleNavigate} />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <React.Suspense fallback={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
            <ActivityIndicator size="large" color="#0EA5E9" />
          </View>
        }>
          {renderScreen()}
        </React.Suspense>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
