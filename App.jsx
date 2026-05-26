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
import MPRReportScreen from './src/screens/MPRReportScreen';
import MemberListScreen from './src/screens/MemberListScreen';
import GoshwaraReportScreen from './src/screens/GoshwaraReportScreen';
import AdminSetupScreen from './src/screens/AdminSetupScreen';
import HealthTrackerScreen from './src/screens/HealthTrackerScreen';
import VitalEventsScreen from './src/screens/VitalEventsScreen';
import VHNDScreen from './src/screens/VHNDScreen';
import ClaimsScreen from './src/screens/ClaimsScreen';
import TeamScreen from './src/screens/TeamScreen';
import AdminSettingsScreen from './src/screens/AdminSettingsScreen';
import FamilyFolderScreen from './src/screens/FamilyFolderScreen';
import LogisticsScreen from './src/screens/LogisticsScreen';
import SurveillanceScreen from './src/screens/SurveillanceScreen';
import WorkplanScreen from './src/screens/WorkplanScreen';
import MODashboard from './src/screens/MODashboard';
import AdminDashboard from './src/screens/AdminDashboard';
import FinancialsScreen from './src/screens/FinancialsScreen';
import { storage, STORAGE_KEYS } from './src/database/storage';
import { cloudSyncManager } from './src/database/cloudSync';
import './src/locales/i18n';

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Login');
  const [user, setUser] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState(null);
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
          if (restoredUser.role === 'Admin') {
            setCurrentScreen('AdminDashboard');
          } else if (restoredUser.role === 'MO') {
            setCurrentScreen('MODashboard');
          } else {
            setCurrentScreen('Dashboard');
          }
        }
      } catch (e) {
        console.warn('Session restore failed:', e);
      }

      // BUG-03 FIX: Only reload if localVersion already exists (skip first-run to prevent loop)
      try {
        const lastCheck = await AsyncStorage.getItem('LAST_VERSION_CHECK') || 0;
        const now = Date.now();
        
        if (now - parseInt(lastCheck) > 14400000) {
          const response = await fetch('/version.json?t=' + now);
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
        await cloudSyncManager.pullFromCloud(restoredUser);
        await cloudSyncManager.startBackgroundSync();
        await storage.autoPrune();
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

    // Periodic cloud pull every 5 minutes (reads user from ref — always fresh)
    const periodicPullId = setInterval(async () => {
      const currentUser = userRef.current;
      if (!currentUser) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      try {
        await cloudSyncManager.pullFromCloud(currentUser);
      } catch (e) {
        console.warn('Periodic pull failed (offline?):', e.message);
      }
    }, 5 * 60 * 1000);

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
      setCurrentScreen('Login');
      return;
    }
    if (data?.member) setSelectedMember(data.member);
    if (data?.family) setSelectedFamily(data.family);
    if (data?.taskId) setSelectedTaskId(data.taskId);
    else setSelectedTaskId(null);
    if (data?.filter) setCurrentFilter(data.filter);
    if (data?.familyId) setFamilyIdFilter(data.familyId);
    if (data?.initialTab) setAdminSetupData(data.initialTab);
    else setAdminSetupData(null);
    setCurrentScreen(screen);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    AsyncStorage.setItem('LOGGED_IN_USER', JSON.stringify(userData)).catch(err => console.warn(err));
    if (userData.role === 'Admin') {
      setCurrentScreen('AdminDashboard');
    } else if (userData.role === 'MO') {
      setCurrentScreen('MODashboard');
    } else {
      // ASHA, ANM, MPW, CHO all use the collaborative Dashboard
      setCurrentScreen('Dashboard');
    }
  };

  const handleFamilySave = async (familyData) => {
    const finalFamily = {
      ...familyData,
      ashaId: familyData.ashaId || user?.id,
      id: familyData.id || storage.generateId('fam', user?.id || 'sys'),
    };
    await storage.save(STORAGE_KEYS.FAMILIES, finalFamily);
    setSelectedFamily(finalFamily);
    setCurrentScreen('MemberRegistration');
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
      ashaId: (user?.role === 'ASHA' ? user.id : selectedMember?.ashaId) || selectedFamily?.ashaId || user?.id,
      villageId: (user?.role === 'ASHA' ? user.villageId : selectedMember?.villageId) || selectedFamily?.villageId || user?.villageId,
      subCenterId: (user?.role === 'ANM' ? user.subCenterId : selectedMember?.subCenterId) || selectedFamily?.subCenterId || user?.subCenterId,
      phcId: selectedMember?.phcId || selectedFamily?.phcId || user?.phcId,
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
      setCurrentScreen(getHomeScreen(user));
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
        return <DailyTaskListScreen user={user} villageName={user?.village} onBack={() => setCurrentScreen(getHomeScreen(user))} />;
      case 'FamilyFolder':
        return <FamilyFolderScreen user={user} onNavigate={handleNavigate} onBack={() => setCurrentScreen(getHomeScreen(user))} />;
      case 'FamilyRegistration':
        return <FamilyRegistrationScreen onSave={handleFamilySave} user={user} onBack={() => setCurrentScreen(getHomeScreen(user))} />;
      case 'MemberRegistration':
        return <MemberRegistrationScreen key={`reg-${registrationKey}`} familyHead={selectedFamily} existingMember={selectedMember} onSave={handleMemberSave} onBack={() => setCurrentScreen(getHomeScreen(user))} />;
      case 'MPRReport':
        return <MPRReportScreen user={user} onBack={() => setCurrentScreen(getHomeScreen(user))} />;
      case 'MemberList':
        return <MemberListScreen 
                  user={user}
                  filterType={currentFilter} 
                  familyId={familyIdFilter}
                  onMemberSelect={(member) => {
                    if (member) {
                      setSelectedMember(member);
                      setCurrentScreen('HealthTracker');
                    }
                  }}
                  onNavigate={handleNavigate}
                  onBack={() => setCurrentScreen(getHomeScreen(user))} 
                />;
      case 'GoshwaraReport':
        return <GoshwaraReportScreen user={user} onBack={() => setCurrentScreen(getHomeScreen(user))} />;
      case 'AdminSetup':
        return <AdminSetupScreen user={user} initialTab={adminSetupData} onBack={() => setCurrentScreen(getHomeScreen(user))} />;
      case 'HealthTracker':
        return <HealthTrackerScreen 
                  user={user}
                  member={selectedMember} 
                  taskId={selectedTaskId}
                  onSave={(updatedMember) => {
                    setSelectedMember(null);
                    setSelectedTaskId(null);
                    setCurrentScreen(getHomeScreen(user));
                  }}
                  onBack={() => {
                    setSelectedTaskId(null);
                    setCurrentScreen(getHomeScreen(user));
                  }} 
                />;
      case 'VitalEvents':
        return <VitalEventsScreen user={user} onBack={() => setCurrentScreen(getHomeScreen(user))} />;
      case 'VHND':
        return <VHNDScreen user={user} onBack={() => setCurrentScreen(getHomeScreen(user))} />;
      case 'Claims':
        return <ClaimsScreen user={user} onBack={() => setCurrentScreen(getHomeScreen(user))} />;
      case 'Team':
        return <TeamScreen user={user} onBack={() => setCurrentScreen(getHomeScreen(user))} />;
      case 'RateSettings':
        return <AdminSettingsScreen user={user} onBack={() => setCurrentScreen(getHomeScreen(user))} />;
      case 'Logistics':
        return <LogisticsScreen user={user} onBack={() => setCurrentScreen(getHomeScreen(user))} />;
      case 'Surveillance':
        return <SurveillanceScreen user={user} onBack={() => setCurrentScreen(getHomeScreen(user))} />;
      case 'Workplan':
        return <WorkplanScreen user={user} onBack={() => setCurrentScreen(getHomeScreen(user))} onNavigate={handleNavigate} />;
      case 'MODashboard':
        return <MODashboard user={user} onBack={() => setCurrentScreen(getHomeScreen(user))} onNavigate={handleNavigate} />;
      case 'AdminDashboard':
        return <AdminDashboard user={user} onBack={() => setCurrentScreen(getHomeScreen(user))} onNavigate={handleNavigate} />;
      case 'Financials':
        return <FinancialsScreen user={user} onBack={() => setCurrentScreen(getHomeScreen(user))} onNavigate={handleNavigate} />;
      default:
        return <DashboardScreen user={user} onNavigate={handleNavigate} />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {renderScreen()}
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
