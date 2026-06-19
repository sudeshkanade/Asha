import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { generateAllTasks } from '../utils/healthLogic';
import { useTranslation } from 'react-i18next';

const WorkplanScreen = ({ user, onBack, onNavigate }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ due: 0, completed: 0 });

  useEffect(() => {
    loadWorkplan();
  }, []);

  const loadWorkplan = async () => {
    setLoading(true);
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    
    // Filter members for this user's jurisdiction
    let members = allMembers;
    if (user?.role === 'ASHA') {
      const rawAssigned = user.assignedVillages || [];
      const assignedIds = new Set(rawAssigned.map(v => {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object') return v.id || v.villageId;
        return null;
      }).filter(Boolean));
      if (user?.villageId) assignedIds.add(user.villageId);
      members = allMembers.filter(m => m.ashaId === user.id || assignedIds.has(m.villageId) || !m.villageId);
    } else if (['ANM', 'MPW', 'CHO'].includes(user?.role)) {
      members = allMembers.filter(m => m.subCenterId === user.subCenterId);
    }

    const allVillages = await storage.getAll(STORAGE_KEYS.VILLAGES);
    const villagesMap = new Map(allVillages.map(v => [v.id || v.villageId, v]));

    // Inject actual village name into members if missing
    members = members.map(m => {
      if (!m.villageName && m.villageId && villagesMap.has(m.villageId)) {
        return { ...m, villageName: villagesMap.get(m.villageId).name };
      }
      return m;
    });

    const allTasks = generateAllTasks(members);
    
    // Filter for "Today" (or due before today and not done)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const dueTasks = allTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate <= today && task.status !== 'completed';
    });

    setTasks(dueTasks);
    setStats({
      due: dueTasks.length,
      completed: allTasks.filter(t => 
        t.status === 'completed' && 
        new Date(t.member.healthData?.lastUpdatedAt || 0).toDateString() === today.toDateString()
      ).length
    });
    setLoading(false);
  };

  const renderTask = ({ item }) => (
    <TouchableOpacity 
      style={styles.taskCard} 
      onPress={() => onNavigate('HealthTracker', { member: item.member, taskId: item.id })}
    >
      <View style={styles.taskIconContainer}>
        <Text style={styles.taskIcon}>
          {item.serviceType?.includes('Vaccination') ? '💉' : 
           item.serviceType?.includes('ANC') ? '🤰' : 
           item.serviceType?.includes('PNC') ? '🤱' : '🏥'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.taskName}>{item.member?.firstName} {item.member?.lastName}</Text>
        <Text style={styles.taskType}>{item.serviceType}</Text>
        <Text style={styles.taskLocation}>{item.member?.villageName || item.member?.villageId} • {item.member?.houseNo}</Text>
      </View>
      <Text style={styles.taskDue}>{t('due', 'Due')}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('workplan')}</Text>
      </View>

      <View style={styles.summaryBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{stats.due}</Text>
          <Text style={styles.statLabel}>{t('tasksDue', 'Tasks Due Today')}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{stats.completed}</Text>
          <Text style={styles.statLabel}>{t('completedToday', 'Completed Today')}</Text>
        </View>
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        <Text style={styles.sectionTitle}>{t('todayVHND', "Today's Action List")}</Text>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <FlatList
            data={tasks}
            renderItem={renderTask}
            keyExtractor={(item, index) => `${item.member.id}-${index}`}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyText}>{t('noTasksToday')}</Text>
              </View>
            }
          />
        )}
      </View>

      <TouchableOpacity style={styles.diaryBtn}>
        <Text style={styles.diaryBtnText}>📔 {t('dailyDiary', 'Generate Daily Diary')}</Text>
      </TouchableOpacity>
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
  summaryBanner: {
    flexDirection: 'row', backgroundColor: COLORS.primary, paddingBottom: 24, paddingHorizontal: 24,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16,
    padding: 16, marginBottom: 12, elevation: 2,
  },
  taskIconContainer: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  taskIcon: { fontSize: 20 },
  taskName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  taskType: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  taskLocation: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  taskDue: { fontSize: 12, fontWeight: '800', color: COLORS.error, backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '600' },
  diaryBtn: {
    position: 'absolute', bottom: 24, left: 24, right: 24,
    backgroundColor: COLORS.secondary, padding: 18, borderRadius: 16,
    alignItems: 'center', elevation: 4,
  },
  diaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

export default WorkplanScreen;
