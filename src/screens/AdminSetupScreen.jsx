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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { cloudSyncManager } from '../database/cloudSync';

const AdminSetupScreen = ({ user, initialTab, onBack }) => {
  const isAdmin = user?.role === 'Admin';
  const [activeTab, setActiveTab] = useState(initialTab || (isAdmin ? 'phcs' : 'sc')); // phcs, sc, villages, approvals
  const [phcs, setPhcs] = useState([]);
  const [subCenters, setSubCenters] = useState([]);
  const [villages, setVillages] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ memberCounts: {}, familyCounts: {} });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scFilter, setScFilter] = useState('all');

  const [newPhc, setNewPhc] = useState({ name: '', block: '' });
  const [newSubCenter, setNewSubCenter] = useState({ name: '', phcId: isAdmin ? '' : user?.phcId });
  const [newVillage, setNewVillage] = useState({ name: '', subCenterId: '', ward: '' });
  const [editingItem, setEditingItem] = useState(null); // { type, id }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const p = await storage.getAll(STORAGE_KEYS.PHCS);
    const s = await storage.getAll(STORAGE_KEYS.SUB_CENTERS);
    const v = await storage.getAll(STORAGE_KEYS.VILLAGES);
    const u = await storage.getAll(STORAGE_KEYS.USERS);
    const members = await storage.getAll(STORAGE_KEYS.MEMBERS);
    const families = await storage.getAll(STORAGE_KEYS.FAMILIES);

    // Calculate Counts
    const mCounts = {};
    const fCounts = {};
    members.forEach(m => {
      if (m.villageId) mCounts[m.villageId] = (mCounts[m.villageId] || 0) + 1;
    });
    families.forEach(f => {
      if (f.villageId) fCounts[f.villageId] = (fCounts[f.villageId] || 0) + 1;
    });

    setPhcs(p);
    setSubCenters(s);
    setVillages(v);
    setUsers(u || []);
    setStats({ memberCounts: mCounts, familyCounts: fCounts });
    setLoading(false);
  };

  const handleAddPhc = async () => {
    if (!newPhc.name) {
      Alert.alert('Error', 'PHC Name is required');
      return;
    }
    if (editingItem) {
      const all = await storage.getAll(STORAGE_KEYS.PHCS);
      const idx = all.findIndex(p => p.id === editingItem.id);
      if (idx >= 0) {
        const updatedItem = { ...all[idx], ...newPhc };
        all[idx] = updatedItem;
        await storage.saveAll(STORAGE_KEYS.PHCS, all);
        await storage.addToSyncQueue(STORAGE_KEYS.PHCS, updatedItem);
      }
      setEditingItem(null);
    } else {
      const phc = { ...newPhc, id: 'phc_' + Date.now() };
      await storage.save(STORAGE_KEYS.PHCS, phc);
    }
    setNewPhc({ name: '', block: '' });
    await loadData();

    // Force immediate push to cloud
    try {
      setLoading(true);
      const res = await cloudSyncManager.startBackgroundSync();
      if (res.success) {
        Alert.alert('Success', `PHC ${editingItem ? 'updated' : 'added'} and synced to cloud.`);
      } else {
        Alert.alert('Partially Saved', `Saved locally, but cloud push failed: ${res.error || 'Check connection'}`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Success', `Saved locally. (Cloud Sync background)`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubCenter = async () => {
    if (!newSubCenter.name || !newSubCenter.phcId) {
      Alert.alert('Error', 'Name and PHC selection are required');
      return;
    }
    if (editingItem) {
      const all = await storage.getAll(STORAGE_KEYS.SUB_CENTERS);
      const idx = all.findIndex(s => s.id === editingItem.id);
      if (idx >= 0) {
        const updatedItem = { ...all[idx], ...newSubCenter };
        all[idx] = updatedItem;
        await storage.saveAll(STORAGE_KEYS.SUB_CENTERS, all);
        await storage.addToSyncQueue(STORAGE_KEYS.SUB_CENTERS, updatedItem);
      }
      setEditingItem(null);
    } else {
      const sc = { ...newSubCenter, id: 'sc_' + Date.now() };
      await storage.save(STORAGE_KEYS.SUB_CENTERS, sc);
    }
    setNewSubCenter({ name: '', phcId: isAdmin ? '' : user?.phcId });
    await loadData();

    // Force immediate push to cloud
    try {
      setLoading(true);
      const res = await cloudSyncManager.startBackgroundSync();
      if (res.success) {
        Alert.alert('Success', `Sub-Center ${editingItem ? 'updated' : 'added'} and synced.`);
      } else {
        Alert.alert('Partially Saved', 'Saved locally. Sync pending.');
      }
    } catch (e) {
      Alert.alert('Success', 'Saved locally.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVillage = async () => {
    if (!newVillage.name || !newVillage.subCenterId) {
      Alert.alert('Error', 'Name and Sub-Center selection are required');
      return;
    }
    if (editingItem) {
      const all = await storage.getAll(STORAGE_KEYS.VILLAGES);
      const idx = all.findIndex(v => v.id === editingItem.id);
      if (idx >= 0) {
        const updatedItem = { ...all[idx], ...newVillage };
        all[idx] = updatedItem;
        await storage.saveAll(STORAGE_KEYS.VILLAGES, all);
        await storage.addToSyncQueue(STORAGE_KEYS.VILLAGES, updatedItem);
      }
      setEditingItem(null);
    } else {
      const village = { ...newVillage, id: 'v_' + Date.now() };
      await storage.save(STORAGE_KEYS.VILLAGES, village);
    }
    setNewVillage({ name: '', subCenterId: '', ward: '' });
    await loadData();
    
    // Force immediate push to cloud
    try {
      setLoading(true);
      const res = await cloudSyncManager.startBackgroundSync();
      if (res.success) {
        Alert.alert('Success', `Village ${editingItem ? 'updated' : 'added'} and synced.`);
      } else {
        Alert.alert('Partially Saved', 'Saved locally. Sync pending.');
      }
    } catch (e) {
      Alert.alert('Success', 'Saved locally.');
    } finally {
      setLoading(false);
    }
  };
  const handleEditStart = (type, item) => {
    setEditingItem({ type, id: item.id });
    if (type === 'phcs') setNewPhc({ name: item.name, block: item.block });
    if (type === 'sc') setNewSubCenter({ name: item.name, phcId: item.phcId });
    if (type === 'villages') setNewVillage({ name: item.name, subCenterId: item.subCenterId, ward: item.ward });
    
    // Scroll to top to see the form
    // Note: ScrollView ref would be better but this works for focus
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setNewPhc({ name: '', block: '' });
    setNewSubCenter({ name: '', phcId: isAdmin ? '' : user?.phcId });
    setNewVillage({ name: '', subCenterId: '', ward: '' });
  };

  const handleDeletePhc = async (id, name) => {
    const currentSubCenters = await storage.getAll(STORAGE_KEYS.SUB_CENTERS);
    const hasChildren = currentSubCenters.some(sc => sc.phcId === id);
    
    if (hasChildren) {
      Alert.alert('Cannot Delete', 'This PHC has linked Sub-Centers. Delete them first.');
      return;
    }

    const confirmDelete = async () => {
      try {
        const all = await storage.getAll(STORAGE_KEYS.PHCS);
        const updated = all.filter(p => p.id !== id);
        await storage.saveAll(STORAGE_KEYS.PHCS, updated);
        await storage.addToDeleteQueue(STORAGE_KEYS.PHCS, id);
        await loadData();
      } catch (e) {
        Alert.alert('Error', 'Failed to delete PHC');
      }
    };

    const isWeb = Platform.OS === 'web' || typeof window !== 'undefined';
    if (isWeb) {
      if (window.confirm(`Are you sure you want to delete ${name}?`)) {
        console.log('AdminSetup: Confirmed delete for PHC', id);
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete PHC',
        `Are you sure you want to delete ${name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete }
        ]
      );
    }
  };

  const handleDeleteSubCenter = async (id, name) => {
    const currentVillages = await storage.getAll(STORAGE_KEYS.VILLAGES);
    const hasChildren = currentVillages.some(v => v.subCenterId === id);
    
    if (hasChildren) {
      Alert.alert('Cannot Delete', 'This Sub-Center has linked Villages. Delete them first.');
      return;
    }

    const confirmDelete = async () => {
      try {
        const all = await storage.getAll(STORAGE_KEYS.SUB_CENTERS);
        const updated = all.filter(sc => sc.id !== id);
        await storage.saveAll(STORAGE_KEYS.SUB_CENTERS, updated);
        await storage.addToDeleteQueue(STORAGE_KEYS.SUB_CENTERS, id);
        await loadData();
      } catch (e) {
        Alert.alert('Error', 'Failed to delete Sub-Center');
      }
    };

    const isWeb = Platform.OS === 'web' || typeof window !== 'undefined';
    if (isWeb) {
      if (window.confirm(`Are you sure you want to delete ${name}?`)) {
        console.log('AdminSetup: Confirmed delete for SC', id);
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Sub-Center',
        `Are you sure you want to delete ${name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete }
        ]
      );
    }
  };

  const handleDeleteVillage = async (id, name) => {
    const confirmDelete = async () => {
      try {
        const all = await storage.getAll(STORAGE_KEYS.VILLAGES);
        const updated = all.filter(v => v.id !== id);
        await storage.saveAll(STORAGE_KEYS.VILLAGES, updated);
        await storage.addToDeleteQueue(STORAGE_KEYS.VILLAGES, id);
        await loadData();
      } catch (e) {
        Alert.alert('Error', 'Failed to delete Village');
      }
    };

    const isWeb = Platform.OS === 'web' || typeof window !== 'undefined';
    if (isWeb) {
      if (window.confirm(`Are you sure you want to delete ${name}?`)) {
        console.log('AdminSetup: Confirmed delete for Village', id);
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Village',
        `Are you sure you want to delete ${name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete }
        ]
      );
    }
  };

  const handleDeleteUser = async (userId, userName, role) => {
    const confirmDelete = async () => {
      try {
        const all = await storage.getAll(STORAGE_KEYS.USERS);
        const updated = all.filter(u => u.id !== userId);
        await storage.saveAll(STORAGE_KEYS.USERS, updated);
        await storage.addToDeleteQueue(STORAGE_KEYS.USERS, userId);
        await loadData();
      } catch (e) {
        Alert.alert('Error', 'Failed to remove user');
      }
    };

    const message = `Are you sure you want to remove ${userName}? They will no longer be able to log in.`;
    const isWeb = Platform.OS === 'web' || typeof window !== 'undefined';
    if (isWeb) {
      if (window.confirm(message)) {
        console.log('AdminSetup: Confirmed delete for User', userId);
        confirmDelete();
      }
    } else {
      Alert.alert(
        `Remove ${role}`,
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: confirmDelete }
        ]
      );
    }
  };
  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      const all = await storage.getAll(STORAGE_KEYS.USERS);
      const idx = all.findIndex(u => u.id === userId);
      if (idx >= 0) {
        const updatedUser = { ...all[idx], approvalStatus: newStatus };
        all[idx] = updatedUser;
        await storage.saveAll(STORAGE_KEYS.USERS, all);
        await storage.addToSyncQueue(STORAGE_KEYS.USERS, updatedUser);
        
        // Push immediately
        await cloudSyncManager.startBackgroundSync();
        
        Alert.alert('User Updated', `User account ${newStatus}.`);
        await loadData();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update user status.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hierarchy Management</Text>
        <TouchableOpacity 
          style={styles.refreshBtn} 
          onPress={async () => {
            setLoading(true);
            await cloudSyncManager.pullFromCloud();
            await loadData();
            setLoading(false);
            Alert.alert('Synced', 'Data updated from cloud.');
          }}
        >
          <Text style={styles.refreshBtnText}>↻ Sync</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {['phcs', 'sc', 'villages', 'approvals'].filter(tabKey => {
          if (user?.role === 'Admin') return true;
          if (tabKey === 'phcs') return false; // Supervisors can't manage PHCs
          if (tabKey === 'approvals') return user?.role === 'MO' || user?.role === 'ANM';
          return true; // Both MO and ANM can see SC and Villages
        }).map(tab => (
          <TouchableOpacity 
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]} 
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'phcs' ? 'PHCs' : tab === 'sc' ? 'Sub-Centers' : tab === 'villages' ? 'Villages' : 'Approvals'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {activeTab === 'villages' && !isAdmin && (
          <TouchableOpacity 
            style={styles.scFilterBtn}
            onPress={() => {
              // Toggle through Sub-centers
              const scIds = ['all', ...subCenters.filter(s => s.phcId === user.phcId).map(s => s.id)];
              const currentIndex = scIds.indexOf(scFilter);
              const nextIndex = (currentIndex + 1) % scIds.length;
              setScFilter(scIds[nextIndex]);
            }}
          >
            <Text style={styles.scFilterText}>
              📍 {scFilter === 'all' ? 'All SCs' : subCenters.find(s => s.id === scFilter)?.name}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'phcs' && (
          <View>
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>{editingItem ? 'Edit PHC' : 'Add Primary Health Center (PHC)'}</Text>
              <TextInput
                style={styles.input}
                placeholder="PHC Name"
                value={newPhc.name}
                onChangeText={(t) => setNewPhc({...newPhc, name: t})}
              />
              <TextInput
                style={styles.input}
                placeholder="Block Name"
                value={newPhc.block}
                onChangeText={(t) => setNewPhc({...newPhc, block: t})}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={handleAddPhc}>
                  <Text style={styles.saveBtnText}>{editingItem ? 'Update PHC' : 'Save PHC'}</Text>
                </TouchableOpacity>
                {editingItem && (
                  <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: '#64748B' }]} onPress={handleCancelEdit}>
                    <Text style={styles.saveBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {phcs
              .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter((p, index, self) => index === self.findIndex((t) => t.id === p.id)) // Deduplicate
              .map(p => (
              <View key={p.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listText}>{p.name}</Text>
                  <Text style={styles.listSubText}>Block: {p.block || 'N/A'}</Text>
                  <Text style={styles.childCountText}>📍 {subCenters.filter(s => s.phcId === p.id).length} Sub-centers</Text>
                  
                  {users.filter(u => u.role === 'MO' && u.phcId === p.id).map(mo => (
                    <View key={mo.id} style={styles.assignedUserRow}>
                      <Text style={styles.assignedUserText}>👤 MO: {mo.name}</Text>
                      <TouchableOpacity onPress={() => handleDeleteUser(mo.id, mo.name, 'MO')}>
                        <Text style={styles.removeUserIcon}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => handleEditStart('phcs', p)} style={styles.iconBtn}>
                    <Text style={styles.editIcon}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeletePhc(p.id, p.name)}
                    style={styles.iconBtn}
                  >
                    <Text style={styles.deleteIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'sc' && (
          <View>
            {/* ... SC Form ... */}
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>{editingItem ? 'Edit Sub-Center' : 'Add Sub-Center (SC)'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Sub-Center Name"
                value={newSubCenter.name}
                onChangeText={(t) => setNewSubCenter({...newSubCenter, name: t})}
              />
              {isAdmin ? (
                <>
                  <Text style={styles.label}>Select Parent PHC</Text>
                  <View style={styles.chipGrid}>
                    {phcs.map(p => (
                      <TouchableOpacity 
                        key={p.id}
                        style={[styles.chip, newSubCenter.phcId === p.id && styles.activeChip]}
                        onPress={() => setNewSubCenter({...newSubCenter, phcId: p.id})}
                      >
                        <Text style={[styles.chipText, newSubCenter.phcId === p.id && styles.activeChipText]}>{p.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Parent PHC:</Text>
                  <Text style={styles.infoValue}>{phcs.find(p => p.id === user?.phcId)?.name || 'My PHC'}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={handleAddSubCenter}>
                  <Text style={styles.saveBtnText}>{editingItem ? 'Update SC' : 'Save Sub-Center'}</Text>
                </TouchableOpacity>
                {editingItem && (
                  <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: '#64748B' }]} onPress={handleCancelEdit}>
                    <Text style={styles.saveBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {subCenters
              .filter(sc => isAdmin || sc.phcId === user?.phcId)
              .filter(sc => sc.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter((s, index, self) => index === self.findIndex((t) => t.id === s.id)) // Deduplicate
              .map(sc => (
              <View key={sc.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listText}>{sc.name}</Text>
                  <Text style={styles.listSubText}>PHC: {phcs.find(p => p.id === sc.phcId)?.name || 'Unknown'}</Text>
                  <Text style={styles.childCountText}>🏡 {villages.filter(v => v.subCenterId === sc.id).length} Villages</Text>
                  
                  {users.filter(u => u.role === 'ANM' && u.subCenterId === sc.id).map(anm => (
                    <View key={anm.id} style={styles.assignedUserRow}>
                      <Text style={styles.assignedUserText}>👤 ANM: {anm.name} ({anm.approvalStatus || 'pending'})</Text>
                      <TouchableOpacity onPress={() => handleDeleteUser(anm.id, anm.name, 'ANM')}>
                        <Text style={styles.removeUserIcon}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => handleEditStart('sc', sc)} style={styles.iconBtn}>
                    <Text style={styles.editIcon}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeleteSubCenter(sc.id, sc.name)}
                    style={styles.iconBtn}
                  >
                    <Text style={styles.deleteIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'villages' && (
          <View>
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>{editingItem ? 'Edit Village' : 'Add Village'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Village Name"
                value={newVillage.name}
                onChangeText={(t) => setNewVillage({...newVillage, name: t})}
              />
              <TextInput
                style={styles.input}
                placeholder="Ward No"
                value={newVillage.ward}
                onChangeText={(t) => setNewVillage({...newVillage, ward: t})}
              />
              <Text style={styles.label}>Select Parent Sub-Center</Text>
              <View style={styles.chipGrid}>
                {subCenters
                  .filter(sc => isAdmin || sc.phcId === user?.phcId)
                  .map(sc => (
                  <TouchableOpacity 
                    key={sc.id}
                    style={[styles.chip, newVillage.subCenterId === sc.id && styles.activeChip]}
                    onPress={() => setNewVillage({...newVillage, subCenterId: sc.id})}
                  >
                    <Text style={[styles.chipText, newVillage.subCenterId === sc.id && styles.activeChipText]}>{sc.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={handleAddVillage}>
                  <Text style={styles.saveBtnText}>{editingItem ? 'Update Village' : 'Save Village'}</Text>
                </TouchableOpacity>
                {editingItem && (
                  <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: '#64748B' }]} onPress={handleCancelEdit}>
                    <Text style={styles.saveBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {villages
              .filter(v => {
                if (isAdmin) return true;
                const sc = subCenters.find(s => s.id === v.subCenterId);
                const belongsToPhc = sc && sc.phcId === user?.phcId;
                const matchesScFilter = scFilter === 'all' || v.subCenterId === scFilter;
                return belongsToPhc && matchesScFilter;
              })
              .filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter((v, index, self) => index === self.findIndex((t) => t.id === v.id)) // Deduplicate
              .map(v => (
              <View key={v.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Text style={styles.listText}>{v.name} (W{v.ward})</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Pop: {stats.memberCounts[v.id] || 0}</Text>
                    </View>
                  </View>
                  <Text style={styles.listSubText}>SC: {subCenters.find(sc => sc.id === v.subCenterId)?.name || 'Unknown'}</Text>
                  <Text style={styles.popStatText}>👪 {stats.familyCounts[v.id] || 0} Families • 👥 {stats.memberCounts[v.id] || 0} Members</Text>
                  
                  {users.filter(u => u.role === 'ASHA' && u.villageId === v.id).map(asha => (
                    <View key={asha.id} style={styles.assignedUserRow}>
                      <Text style={styles.assignedUserText}>👤 ASHA: {asha.name} ({asha.approvalStatus || 'pending'})</Text>
                      <TouchableOpacity onPress={() => handleDeleteUser(asha.id, asha.name, 'ASHA')}>
                        <Text style={styles.removeUserIcon}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => handleEditStart('villages', v)} style={styles.iconBtn}>
                    <Text style={styles.editIcon}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeleteVillage(v.id, v.name)}
                    style={styles.iconBtn}
                  >
                    <Text style={styles.deleteIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        {activeTab === 'approvals' && (
          <View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Role-Based Control:</Text>
              <Text style={styles.infoValue}>
                {isAdmin ? 'Full System Approver' : 
                 user.role === 'MO' ? `PHC Supervisor (${user.phcName})` : 
                 `SC Supervisor (${user.subCenterName})`}
              </Text>
            </View>

            {users
              .filter(u => {
                // 1. Only show non-approved or rejected users
                if (u.approvalStatus === 'approved') return false;
                
                // 2. Hierarchy Filter
                if (isAdmin) return true;
                if (user.role === 'MO') {
                  // MO can approve anyone in their PHC
                  return u.phcId === user.phcId;
                }
                if (user.role === 'ANM') {
                  // ANM can approve ASHAs in their SC
                  return u.subCenterId === user.subCenterId && u.role === 'ASHA';
                }
                return false;
              })
              .map(u => (
                <View key={u.id} style={[styles.listItem, { borderLeftColor: u.approvalStatus === 'rejected' ? COLORS.error : '#EAB308' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listText}>{u.name} ({u.role})</Text>
                    <Text style={styles.listSubText}>Username: {u.username}</Text>
                    <Text style={styles.listSubText}>Village: {u.villageName || 'N/A'}</Text>
                    <Text style={styles.listSubText}>Status: <Text style={{fontWeight:'700', color: u.approvalStatus === 'rejected' ? COLORS.error : '#EAB308'}}>{u.approvalStatus?.toUpperCase()}</Text></Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity 
                      style={[styles.approveBtn, { backgroundColor: COLORS.success }]} 
                      onPress={() => handleUpdateUserStatus(u.id, 'approved')}
                    >
                      <Text style={styles.approveBtnText}>✓ Approve</Text>
                    </TouchableOpacity>
                    {u.approvalStatus !== 'rejected' && (
                      <TouchableOpacity 
                        style={[styles.approveBtn, { backgroundColor: COLORS.error }]} 
                        onPress={() => handleUpdateUserStatus(u.id, 'rejected')}
                      >
                        <Text style={styles.approveBtnText}>✕ Reject</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            }
            
            {users.filter(u => {
                if (u.approvalStatus === 'approved') return false;
                if (isAdmin) return true;
                if (user.role === 'MO') return u.phcId === user.phcId;
                if (user.role === 'ANM') return u.subCenterId === user.subCenterId && u.role === 'ASHA';
                return false;
              }).length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No pending user approvals for your area.</Text>
                </View>
              )
            }
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, backgroundColor: COLORS.surface, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 10, marginRight: 10 },
  backBtnText: { fontSize: 24, color: COLORS.primary, fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, padding: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 12 },
  activeTabText: { color: COLORS.primary },
  content: { padding: 20, maxWidth: 600, width: '100%', alignSelf: 'center' },
  formCard: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 16, marginBottom: 24, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 15, color: COLORS.text },
  input: { height: 48, backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textSecondary },
  activeChipText: { color: '#FFF', fontWeight: '700' },
  saveBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  sectionHeader: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 15, textTransform: 'uppercase' },
  listItem: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: COLORS.secondary, elevation: 1, flexDirection: 'row', alignItems: 'center' },
  listText: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  listSubText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  deleteIcon: { fontSize: 20, color: COLORS.error, fontWeight: '600' },
  editIcon: { fontSize: 20, color: COLORS.primary, fontWeight: '600' },
  iconBtn: { padding: 10, marginLeft: 5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  assignedUserRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0FDF4', padding: 8, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#DCFCE7' },
  assignedUserText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  removeUserIcon: { fontSize: 18, color: COLORS.error, fontWeight: '800', paddingHorizontal: 5 },
  refreshBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#F1F5F9', borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  refreshBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  infoBox: { backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginRight: 8 },
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  approveBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  approveBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { color: COLORS.textSecondary, fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
  searchBarContainer: { padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', gap: 10 },
  searchBar: { flex: 1, height: 40, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 15, fontSize: 13, color: COLORS.text },
  scFilterBtn: { paddingHorizontal: 12, justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 20 },
  scFilterText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  childCountText: { fontSize: 11, color: COLORS.primary, fontWeight: '700', marginTop: 4 },
  popStatText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', marginTop: 4, backgroundColor: '#F8FAFC', padding: 4, borderRadius: 4, alignSelf: 'flex-start' },
  badge: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#BAE6FD' },
  badgeText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
});

export default AdminSetupScreen;
