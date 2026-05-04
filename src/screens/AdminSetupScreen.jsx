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

const AdminSetupScreen = ({ user, onBack }) => {
  const isAdmin = user?.role === 'Admin';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'phcs' : 'sc'); // phcs, sc, villages
  const [phcs, setPhcs] = useState([]);
  const [subCenters, setSubCenters] = useState([]);
  const [villages, setVillages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
    setPhcs(p);
    setSubCenters(s);
    setVillages(v);
    setUsers(u || []);
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
        all[idx] = { ...all[idx], ...newPhc };
        await storage.saveAll(STORAGE_KEYS.PHCS, all);
      }
      setEditingItem(null);
    } else {
      const phc = { ...newPhc, id: 'phc_' + Date.now() };
      await storage.save(STORAGE_KEYS.PHCS, phc);
    }
    setNewPhc({ name: '', block: '' });
    loadData();
    Alert.alert('Success', editingItem ? 'PHC updated' : 'PHC added');
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
        all[idx] = { ...all[idx], ...newSubCenter };
        await storage.saveAll(STORAGE_KEYS.SUB_CENTERS, all);
      }
      setEditingItem(null);
    } else {
      const sc = { ...newSubCenter, id: 'sc_' + Date.now() };
      await storage.save(STORAGE_KEYS.SUB_CENTERS, sc);
    }
    setNewSubCenter({ name: '', phcId: isAdmin ? '' : user?.phcId });
    loadData();
    Alert.alert('Success', editingItem ? 'Sub-Center updated' : 'Sub-Center added');
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
        all[idx] = { ...all[idx], ...newVillage };
        await storage.saveAll(STORAGE_KEYS.VILLAGES, all);
      }
      setEditingItem(null);
    } else {
      const village = { ...newVillage, id: 'v_' + Date.now() };
      await storage.save(STORAGE_KEYS.VILLAGES, village);
    }
    setNewVillage({ name: '', subCenterId: '', ward: '' });
    loadData();
    Alert.alert('Success', editingItem ? 'Village updated' : 'Village added');
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
        await loadData();
      } catch (e) {
        Alert.alert('Error', 'Failed to delete PHC');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete ${name}?`)) confirmDelete();
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
        await loadData();
      } catch (e) {
        Alert.alert('Error', 'Failed to delete Sub-Center');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete ${name}?`)) confirmDelete();
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
        await loadData();
      } catch (e) {
        Alert.alert('Error', 'Failed to delete Village');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete ${name}?`)) confirmDelete();
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
        await loadData();
      } catch (e) {
        Alert.alert('Error', 'Failed to remove user');
      }
    };

    const message = `Are you sure you want to remove ${userName}? They will no longer be able to log in.`;
    
    if (Platform.OS === 'web') {
      if (window.confirm(message)) confirmDelete();
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
      </View>

      <View style={styles.tabBar}>
        {['phcs', 'sc', 'villages'].filter(t => isAdmin || t !== 'phcs').map(tab => (
          <TouchableOpacity 
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]} 
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
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

            <Text style={styles.sectionHeader}>Registered PHCs</Text>
            {phcs.map(p => (
              <View key={p.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listText}>{p.name}</Text>
                  <Text style={styles.listSubText}>Block: {p.block || 'N/A'}</Text>
                  
                  {users.filter(u => u.role === 'MO' && u.phcId === p.id).map(mo => (
                    <View key={mo.id} style={styles.assignedUserRow}>
                      <Text style={styles.assignedUserText}>👨‍⚕️ MO: {mo.name}</Text>
                      <TouchableOpacity onPress={() => handleDeleteUser(mo.id, mo.name, 'MO')}>
                        <Text style={styles.removeUserIcon}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => handleEditStart('phcs', p)}>
                    <Text style={styles.editIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('Delete PHC pressed:', p.id);
                      handleDeletePhc(p.id, p.name);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
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

            <Text style={styles.sectionHeader}>Registered Sub-Centers</Text>
            {subCenters
              .filter(sc => isAdmin || sc.phcId === user?.phcId)
              .map(sc => (
              <View key={sc.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listText}>{sc.name}</Text>
                  <Text style={styles.listSubText}>PHC: {phcs.find(p => p.id === sc.phcId)?.name || 'Unknown'}</Text>
                  
                  {users.filter(u => u.role === 'ANM' && u.subCenterId === sc.id).map(anm => (
                    <View key={anm.id} style={styles.assignedUserRow}>
                      <Text style={styles.assignedUserText}>👩‍⚕️ ANM: {anm.name}</Text>
                      <TouchableOpacity onPress={() => handleDeleteUser(anm.id, anm.name, 'ANM')}>
                        <Text style={styles.removeUserIcon}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => handleEditStart('sc', sc)}>
                    <Text style={styles.editIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('Delete SC pressed:', sc.id);
                      handleDeleteSubCenter(sc.id, sc.name);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
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

            <Text style={styles.sectionHeader}>Registered Villages</Text>
            {villages
              .filter(v => {
                if (isAdmin) return true;
                const sc = subCenters.find(s => s.id === v.subCenterId);
                return sc && sc.phcId === user?.phcId;
              })
              .map(v => (
              <View key={v.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listText}>{v.name} (W{v.ward})</Text>
                  <Text style={styles.listSubText}>SC: {subCenters.find(sc => sc.id === v.subCenterId)?.name || 'Unknown'}</Text>
                  
                  {users.filter(u => u.role === 'ASHA' && u.villageId === v.id).map(asha => (
                    <View key={asha.id} style={styles.assignedUserRow}>
                      <Text style={styles.assignedUserText}>👩‍⚕️ ASHA: {asha.name}</Text>
                      <TouchableOpacity onPress={() => handleDeleteUser(asha.id, asha.name, 'ASHA')}>
                        <Text style={styles.removeUserIcon}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => handleEditStart('villages', v)}>
                    <Text style={styles.editIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('Delete Village pressed:', v.id);
                      handleDeleteVillage(v.id, v.name);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
  content: { padding: 20 },
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
  deleteIcon: { fontSize: 18, color: COLORS.error, padding: 10 },
  editIcon: { fontSize: 18, color: COLORS.primary, padding: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  assignedUserRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0FDF4', padding: 8, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#DCFCE7' },
  assignedUserText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  removeUserIcon: { fontSize: 16, color: COLORS.error, fontWeight: '800', paddingHorizontal: 5 },
  infoBox: { backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginRight: 8 },
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});

export default AdminSetupScreen;
