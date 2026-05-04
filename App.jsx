import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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
import AdminSettingsScreen from './src/screens/AdminSettingsScreen2';
import FamilyFolderScreen from './src/screens/FamilyFolderScreen';
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
  const [registrationKey, setRegistrationKey] = useState(1);


  useEffect(() => {
    const APP_VERSION = '1.1.3';
    
    const initApp = async () => {
      // 1. Version Check (Cache Buster)
      const storedVersion = await storage.getRaw('app_version');
      if (storedVersion && storedVersion !== APP_VERSION) {
        await storage.saveRaw('app_version', APP_VERSION);
        if (typeof window !== 'undefined') window.location.reload(true);
      } else {
        await storage.saveRaw('app_version', APP_VERSION);
      }

      // 2. Initial Sync (Pull hierarchy and updates)
      console.log("App: Performing initial cloud pull...");
      await cloudSyncManager.pullFromCloud();
      await cloudSyncManager.startBackgroundSync();
    };

    initApp();

    // Start background sync polling every 2 minutes
    const intervalId = setInterval(() => {
      cloudSyncManager.startBackgroundSync();
    }, 2 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentScreen('Dashboard');
  };

  const handleFamilySave = async (familyData) => {
    const finalFamily = {
      ...familyData,
      id: familyData.id || Date.now().toString(),
    };
    await storage.save(STORAGE_KEYS.FAMILIES, finalFamily);
    setSelectedFamily(finalFamily);
    setCurrentScreen('MemberRegistration');
  };

  const handleMemberSave = async (memberData, addAnother = false) => {
    // FIX A1: Map 'relation' field to 'relationToHead' for all downstream consumers
    const { relation, ...restMemberData } = memberData;
    const finalMember = {
      ...selectedMember,
      ...restMemberData,
      relation: relation,                        // keep original for form re-editing
      relationToHead: relation,                   // canonical field used everywhere else
      id: selectedMember?.id || Date.now().toString(),
      familyId: selectedFamily?.id || selectedMember?.familyId,
      houseNo: selectedFamily?.houseNo || selectedMember?.houseNo,
      status: selectedMember?.status || 'Active',
      ashaId: user?.id,
      villageId: user?.villageId || selectedFamily?.villageId,
      subCenterId: user?.subCenterId,
      phcId: user?.phcId
    };
    
    await storage.save(STORAGE_KEYS.MEMBERS, finalMember);

    // Sync Head Name to Family Record
    if (finalMember.relationToHead === 'Self (Head)' || finalMember.relationToHead === 'head' || !selectedFamily?.headName) {
      const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
      const famIndex = allFamilies.findIndex(f => f.id === finalMember.familyId);
      if (famIndex >= 0) {
        allFamilies[famIndex].headName = `${finalMember.firstName} ${finalMember.lastName}`;
        await storage.saveAll(STORAGE_KEYS.FAMILIES, allFamilies);
      }
    }

    if (addAnother) {
      setSelectedMember(null);
      setRegistrationKey(prev => prev + 1);
      // Stay on the MemberRegistration screen
    } else {
      setSelectedMember(null);
      setSelectedFamily(null);
      setCurrentScreen('Dashboard');
    }
  };

  const [adminSetupData, setAdminSetupData] = useState(null);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Login':
        return <LoginScreen onLogin={handleLogin} />;
      case 'Dashboard':
        return <DashboardScreen 
                 user={user} 
                 onNavigate={(screen, data) => {
                   if (screen === 'Login') {
                     // FIX D2: Clear all state on logout
                     setUser(null);
                     setSelectedMember(null);
                     setSelectedFamily(null);
                     setCurrentFilter(null);
                     setFamilyIdFilter(null);
                     setAdminSetupData(null);
                     setCurrentScreen('Login');
                     return;
                   }
                   if (data?.member) setSelectedMember(data.member);
                   if (data?.filter) setCurrentFilter(data.filter);
                   if (data?.familyId) setFamilyIdFilter(data.familyId);
                   if (data?.initialTab) setAdminSetupData(data.initialTab);
                   else setAdminSetupData(null);
                   setCurrentScreen(screen);
                 }} 
               />;
      case 'Tasks':
        return <DailyTaskListScreen user={user} villageName={user?.village} onBack={() => setCurrentScreen('Dashboard')} />;
      case 'FamilyFolder':
        // FIX D1: Extract member data for EC→HealthTracker navigation
        return <FamilyFolderScreen user={user} onNavigate={(screen, data) => {
          if (data?.member) setSelectedMember(data.member);
          if (data?.familyId) setFamilyIdFilter(data.familyId);
          if (data?.family) setSelectedFamily(data.family);
          setCurrentScreen(screen);
        }} onBack={() => setCurrentScreen('Dashboard')} />;
      case 'FamilyRegistration':
        return <FamilyRegistrationScreen onSave={handleFamilySave} user={user} onBack={() => setCurrentScreen('Dashboard')} />;
      case 'MemberRegistration':
        return <MemberRegistrationScreen key={`reg-${registrationKey}`} familyHead={selectedFamily} existingMember={selectedMember} onSave={handleMemberSave} onBack={() => setCurrentScreen('Dashboard')} />;
      case 'MPRReport':
        return <MPRReportScreen user={user} onBack={() => setCurrentScreen('Dashboard')} />;
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
                  onNavigate={(screen, data) => {
                    if (data?.familyId) setFamilyIdFilter(data.familyId);
                    if (data?.family) setSelectedFamily(data.family);
                    if (data?.member) setSelectedMember(data.member);
                    setCurrentScreen(screen);
                  }}
                  onBack={() => setCurrentScreen('Dashboard')} 
                />;
      case 'GoshwaraReport':
        return <GoshwaraReportScreen user={user} onBack={() => setCurrentScreen('Dashboard')} />;
      case 'AdminSetup':
        return <AdminSetupScreen user={user} initialTab={adminSetupData} onBack={() => setCurrentScreen('Dashboard')} />;
      case 'HealthTracker':
        return <HealthTrackerScreen 
                  member={selectedMember} 
                  onSave={(updatedMember) => {
                    setSelectedMember(null);
                    setCurrentScreen('Dashboard');
                  }}
                  onBack={() => setCurrentScreen('Dashboard')} 
                />;
      case 'VitalEvents':
        return <VitalEventsScreen user={user} onBack={() => setCurrentScreen('Dashboard')} />;
      case 'VHND':
        return <VHNDScreen user={user} onBack={() => setCurrentScreen('Dashboard')} />;
      case 'Claims':
        return <ClaimsScreen user={user} onBack={() => setCurrentScreen('Dashboard')} />;
      case 'Team':
        return <TeamScreen user={user} onBack={() => setCurrentScreen('Dashboard')} />;
      case 'RateSettings':
        return <AdminSettingsScreen user={user} onBack={() => setCurrentScreen('Dashboard')} />;
      default:
        return <DashboardScreen user={user} onNavigate={(screen) => setCurrentScreen(screen)} />;
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
