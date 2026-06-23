import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { calculateMaternalSchedule, calculateChildSchedule, calculateVaccinationSchedule, calculateAge } from '../utils/healthLogic';
import { useTranslation } from 'react-i18next';
import { generateAllTasks } from '../utils/healthLogic';

const DailyTaskListScreen = ({ user, villageName, onBack }) => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [familiesMap, setFamiliesMap] = useState({});
  const [expandedHouseholds, setExpandedHouseholds] = useState({});
  
  // New filters and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending', 'completed', 'all'
  const [filterPriority, setFilterPriority] = useState('all'); // 'all', 'high'
  const [filterTime, setFilterTime] = useState('active_pending'); // 'all', 'today_overdue', 'this_week', 'active_pending', 'past_tasks'

  const [expandedTasks, setExpandedTasks] = useState({});
  const [completionDataMap, setCompletionDataMap] = useState({});

  React.useEffect(() => {
    loadTasksFromStorage();
  }, []);

  const loadTasksFromStorage = async () => {
    setLoading(true);
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    const allFamilies = await storage.getAll(STORAGE_KEYS.FAMILIES);
    
    // Create families map for quick lookup
    const fMap = {};
    allFamilies.forEach(f => {
      fMap[f.id] = f;
    });
    setFamiliesMap(fMap);
    
    // Hierarchy filtering - only show tasks for user's scope
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
    } else if (user?.role === 'ANM') {
      members = allMembers.filter(m => m.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      members = allMembers.filter(m => m.phcId === user.phcId);
    }

    const generatedTasks = generateAllTasks(members);

    // Initial sort
    const sortedTasks = generatedTasks.sort((a, b) => {
      if (a.priority === 'High' && b.priority !== 'High') return -1;
      if (a.priority !== 'High' && b.priority === 'High') return 1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    setTasks(sortedTasks);
    setLoading(false);
  };

  const handleStatusChange = (task) => {
    if (task.status === 'completed') {
      toggleTaskStatus(task.id);
    } else {
      toggleTaskExpanded(task.id);
    }
  };

  const toggleTaskExpanded = (id) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
    if (!completionDataMap[id]) {
      setCompletionDataMap(prev => ({ ...prev, [id]: { reasoning: '', image: null } }));
    }
  };

  const toggleTaskStatus = async (id) => {
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;

    const newStatus = taskToToggle.status === 'completed' ? 'pending' : 'completed';

    try {
      if (newStatus === 'pending') {
        const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
        const memberIndex = allMembers.findIndex(m => m.id === taskToToggle.memberId);
        if (memberIndex >= 0) {
          const member = allMembers[memberIndex];
          const healthData = member.healthData || {};
          const completedTasks = (healthData.completedTasks || []).filter(tid => tid !== id);
          member.healthData = { ...healthData, completedTasks };
          member.lastUpdatedAt = Date.now();
          await storage.save(STORAGE_KEYS.MEMBERS, member);
        }
      }

      setTasks(tasks.map(task => {
        if (task.id === id) {
          return { 
            ...task, 
            status: newStatus,
            visitSummary: newStatus === 'completed' ? completionData.reasoning : null,
            visitImage: newStatus === 'completed' ? completionData.image : null,
          };
        }
        return task;
      }));
    } catch (e) {
      console.error('Failed to toggle task status', e);
    }
    
    setCompletionModalVisible(false);
    setSelectedTask(null);
  };

  const submitCompletion = async (taskOverride = null, isQuick = false) => {
    const taskToComplete = taskOverride || selectedTask;
    if (!taskToComplete) return;

    const data = completionDataMap[taskToComplete.id] || { reasoning: '', image: null };
    const reasoningToSave = isQuick ? 'Routine task completed' : data.reasoning;

    if (!isQuick && !reasoningToSave.trim()) {
      if (Platform.OS === 'web') window.alert(t('provideVisitSummary'));
      else Alert.alert(t('error'), t('provideVisitSummary'));
      return;
    }

    try {
      const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
      const memberIndex = allMembers.findIndex(m => m.id === taskToComplete.memberId);
      
      if (memberIndex >= 0) {
        const member = allMembers[memberIndex];
        const healthData = member.healthData || {};
        const completedTasks = healthData.completedTasks || [];
        
        if (!completedTasks.includes(taskToComplete.id)) {
          completedTasks.push(taskToComplete.id);
        }
        
        member.healthData = { ...healthData, completedTasks };
        member.lastUpdatedAt = Date.now(); // Update timestamp on mutation
        await storage.save(STORAGE_KEYS.MEMBERS, member);
        
        await storage.addToSyncQueue('task_completions', {
          taskId: taskToComplete.id,
          memberId: member.id,
          completedAt: new Date().toISOString(),
          reasoning: reasoningToSave,
          image: isQuick ? null : data.image
        });
      }
      
      // LOGIC-1 FIX: Use functional state update form to avoid reading stale 'tasks' closure.
      // If two completions fire quickly (e.g. double-tap), both now read the latest state.
      setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === taskToComplete.id) {
          return { 
            ...task, 
            status: 'completed',
            visitSummary: reasoningToSave,
            visitImage: isQuick ? null : data.image,
          };
        }
        return task;
      }));
      setExpandedTasks(prev => ({ ...prev, [taskToComplete.id]: false }));
      
      if (!isQuick) {
        if (Platform.OS === 'web') window.alert(t('taskMarkedDone'));
        else Alert.alert(t('success'), t('taskMarkedDone'));
      }
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') window.alert(t('taskSaveFailed'));
      else Alert.alert(t('error'), t('taskSaveFailed'));
    }
  };

  // Batch completion of all pending tasks for a member
  const handleCompleteAllForMember = async (memberId, memberTasks) => {
    const pendingTasks = memberTasks.filter(t => t.status !== 'completed');
    if (pendingTasks.length === 0) return;

    const performComplete = async () => {
      try {
        setLoading(true);
        const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
        const memberIndex = allMembers.findIndex(m => m.id === memberId);
        
        if (memberIndex >= 0) {
          const member = allMembers[memberIndex];
          const healthData = member.healthData || {};
          // LOGIC-2 FIX: Do not mutate the array extracted from storage.
          // Spread into a Set to deduplicate, then spread back to an array.
          const existingCompleted = new Set(healthData.completedTasks || []);
          pendingTasks.forEach(task => existingCompleted.add(task.id));
          const completedTasks = [...existingCompleted];
          
          member.healthData = { ...healthData, completedTasks };
          member.lastUpdatedAt = Date.now();
          await storage.save(STORAGE_KEYS.MEMBERS, member);
          
          // Queue sync tasks for all completed items
          for (const task of pendingTasks) {
            await storage.addToSyncQueue('task_completions', {
              taskId: task.id,
              memberId: member.id,
              completedAt: new Date().toISOString(),
              reasoning: 'Batch completed via household list',
              image: null
            });
          }
        }
        
        // Update local UI state
        const taskIdsToComplete = new Set(pendingTasks.map(t => t.id));
        setTasks(prevTasks => prevTasks.map(task => {
          if (taskIdsToComplete.has(task.id)) {
            return {
              ...task,
              status: 'completed',
              visitSummary: 'Batch completed via household list',
              visitImage: null,
            };
          }
          return task;
        }));
        
        if (Platform.OS === 'web') window.alert(t('allTasksCompleted', 'All pending visits marked complete.'));
        else Alert.alert(t('success'), t('allTasksCompleted', 'All pending visits marked complete.'));
      } catch (e) {
        console.error(e);
        if (Platform.OS === 'web') window.alert(t('taskSaveFailed'));
        else Alert.alert(t('error'), t('taskSaveFailed'));
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${t('completeAllConfirm', 'Are you sure you want to mark all pending visits complete for')} ${pendingTasks[0].memberName}?`)) {
        await performComplete();
      }
    } else {
      Alert.alert(
        t('confirm', 'Confirm'),
        `${t('completeAllConfirm', 'Are you sure you want to mark all pending visits complete for')} ${pendingTasks[0].memberName}?`,
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('done'), onPress: performComplete }
        ]
      );
    }
  };

  const handleWhatsApp = (task) => {
    let message = '';
    const taskType = task.serviceType?.toLowerCase() || '';
    
    if (taskType.includes('vaccination') || taskType.includes('vax')) {
      message = t('immunizationReminder', { name: task.memberName });
    } else if (taskType.includes('anc') || taskType.includes('pregnancy')) {
      message = t('ancReminder', { name: task.memberName });
    } else {
      message = t('checkupReminder', { name: task.memberName });
    }
    
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
  };

  const handleCaptureImage = async (taskId) => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(t('error', 'Error'), t('cameraPermissionRequired', 'Camera permission is required to capture evidence.'));
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setCompletionDataMap(prev => {
          const existing = prev[taskId] || { reasoning: '', image: null };
          return { ...prev, [taskId]: { ...existing, image: imageUri } };
        });
      }
    } catch (e) {
      console.error('Camera error:', e);
      Alert.alert(t('error', 'Error'), 'Failed to open camera.');
    }
  };

  const toggleHouseholdExpanded = (key) => {
    setExpandedHouseholds(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 1. FILTERING FLAT TASK LIST
  const filteredTasks = tasks.filter(task => {
    // A. Status Filter
    if (filterStatus === 'pending' && task.status === 'completed') return false;
    if (filterStatus === 'completed' && task.status !== 'completed') return false;

    // B. Priority Filter
    if (filterPriority === 'high' && task.priority !== 'High') return false;

    // C. Time Filter
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0,0,0,0);
    const diffDays = (today - dueDate) / (1000 * 60 * 60 * 24);

    if (filterTime === 'active_pending') {
      if (diffDays > 30 && task.status !== 'completed') return false; 
    } else if (filterTime === 'past_tasks') {
      if (diffDays <= 30) return false;
    } else if (filterTime === 'today_overdue') {
      if (dueDate > today) return false;
    } else if (filterTime === 'this_week') {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      if (dueDate > nextWeek) return false;
    }

    // D. Search Query Filter (member name, house number, or service type)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = String(task.memberName || '').toLowerCase().includes(query);
      const houseMatch = String(task.houseNo || '').toLowerCase().includes(query);
      const serviceMatch = String(task.serviceType || '').toLowerCase().includes(query);
      if (!nameMatch && !houseMatch && !serviceMatch) return false;
    }

    return true;
  });

  // 2. HIERARCHICAL GROUPING: Household -> Member -> Tasks
  const groupedByHousehold = {};
  filteredTasks.forEach(task => {
    const member = task.member || {};
    const familyId = member.familyId || 'unknown';
    const houseNo = task.houseNo || member.houseNo || 'N/A';

    const family = familiesMap[familyId] || {};
    const headName = family.headName ? `${t('folder', 'Family Head')}: ${family.headName}` : `${t('house', 'House')} ${houseNo}`;
    // UI-4 FIX: 'villageName' was being declared using itself in its own initializer
    // (referencing the prop of the same name), a latent ReferenceError in strict mode.
    // Renamed to 'resolvedVillageName' to avoid the self-referential assignment.
    const resolvedVillageName = member.villageName || family.villageName || villageName || 'N/A';

    const key = familyId !== 'unknown' ? familyId : `house-${houseNo}`;

    if (!groupedByHousehold[key]) {
      groupedByHousehold[key] = {
        key,
        familyId,
        headName,
        houseNo,
        villageName: resolvedVillageName,
        hasHighRisk: false,
        pendingCount: 0,
        members: {}
      };
    }

    const hh = groupedByHousehold[key];
    if (task.priority === 'High') {
      hh.hasHighRisk = true;
    }
    if (task.status !== 'completed') {
      hh.pendingCount += 1;
    }

    const memberId = task.memberId;
    if (!hh.members[memberId]) {
      hh.members[memberId] = {
        memberId,
        memberName: task.memberName,
        age: member.age || (member.dob ? calculateAge(member.dob) : null),
        gender: member.gender,
        tasks: []
      };
    }
    hh.members[memberId].tasks.push(task);
  });

  // Convert map to sorted array
  const householdList = Object.values(groupedByHousehold).sort((a, b) => {
    // High risk households first
    if (a.hasHighRisk && !b.hasHighRisk) return -1;
    if (!a.hasHighRisk && b.hasHighRisk) return 1;
    // Pending tasks count descending
    if (a.pendingCount !== b.pendingCount) {
      return b.pendingCount - a.pendingCount;
    }
    // House Number alphabetical/numeric
    return String(a.houseNo || '').localeCompare(String(b.houseNo || ''), undefined, { numeric: true, sensitivity: 'base' });
  });

  // Helper renderers
  const renderSubTask = (task) => {
    const isCompleted = task.status === 'completed';
    const isHigh = task.priority === 'High';
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(task.dueDate);
    const isOverdue = !isCompleted && dueDate < today;

    let borderLeftColor = COLORS.primary;
    if (isCompleted) borderLeftColor = COLORS.success;
    else if (isHigh) borderLeftColor = COLORS.error;

    const isExpanded = !!expandedTasks[task.id];
    const data = completionDataMap[task.id] || { reasoning: '', image: null };

    return (
      <View key={task.id} style={[styles.subTaskCard, { borderLeftColor }]}>
        <TouchableOpacity 
          style={styles.subTaskInfo}
          onPress={() => toggleTaskExpanded(task.id)}
          activeOpacity={0.7}
        >
          <View style={styles.subTaskHeader}>
            <Text style={styles.subTaskService}>{task.serviceType}</Text>
            <Text style={[styles.subTaskDueDate, isOverdue && styles.subTaskDueDateOverdue]}>
              📅 {dueDate.toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.subTaskDetails} numberOfLines={isExpanded ? null : 2}>
            {task.details}
          </Text>
        </TouchableOpacity>
        
        {isExpanded && !isCompleted && (
          <View style={styles.expandedTaskContent}>
            <Text style={styles.label}>{t('visitSummaryReasoning', 'Visit Summary & Reasoning')}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={t('visitSummary', 'Enter details here...')}
              multiline
              numberOfLines={3}
              value={data.reasoning}
              onChangeText={(text) => setCompletionDataMap(prev => ({ ...prev, [task.id]: { ...data, reasoning: text } }))}
            />
            {data.image ? (
              <View style={styles.capturedImageContainer}>
                <Image source={{ uri: data.image }} style={styles.capturedImage} />
                <TouchableOpacity style={styles.retakeBtn} onPress={() => setCompletionDataMap(prev => ({ ...prev, [task.id]: { ...data, image: null } }))}>
                  <Text style={styles.retakeBtnText}>{t('retakePhoto', 'Retake Photo')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.cameraBtn} onPress={() => handleCaptureImage(task.id)}>
                <Text style={styles.cameraBtnText}>📷 Capture Evidence</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.submitBtn} onPress={() => submitCompletion(task, false)}>
              <Text style={styles.submitBtnText}>{t('submitMarkDone', 'Submit & Mark Done')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {isExpanded && isCompleted && (
          <View style={styles.expandedTaskContent}>
            <Text style={styles.label}>{t('visitSummary', 'Visit Summary')}</Text>
            <Text style={styles.summaryValueText}>{task.visitSummary}</Text>
            {task.visitImage && (
               <Image source={{ uri: task.visitImage }} style={styles.evidenceImage} />
            )}
            <TouchableOpacity style={[styles.statusToggleBtn, { backgroundColor: '#f0f0f0', marginTop: 12 }]} onPress={() => toggleTaskStatus(task.id)}>
              <Text style={[styles.statusToggleText, { color: COLORS.text }]}>{t('markAsPending')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isExpanded && (
          <View style={styles.subTaskFooter}>
            <View style={styles.statusBadge}>
              <Text style={[styles.statusText, { color: isCompleted ? COLORS.success : COLORS.accent }]}>
                ● {task.status.toUpperCase()}
              </Text>
              {!isCompleted && (
                <TouchableOpacity onPress={() => handleWhatsApp(task)} style={styles.whatsappBtn}>
                  <Text style={styles.whatsappIcon}>💬</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.actionButton, isCompleted && styles.actionButtonDone]}
              onPress={() => handleStatusChange(task)}
              onLongPress={() => {
                if (!isCompleted) submitCompletion(task, true);
              }}
            >
              <Text style={styles.actionButtonText}>
                {isCompleted ? t('reset') : t('done')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderMember = (member) => {
    const pendingMemberTasks = member.tasks.filter(t => t.status !== 'completed');
    const hasPending = pendingMemberTasks.length > 0;

    return (
      <View key={member.memberId} style={styles.memberBox}>
        <View style={styles.memberHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.memberTitle}>{member.memberName}</Text>
            <Text style={styles.memberSub}>
              {member.gender ? t(member.gender?.toLowerCase()) : ''} 
              {member.age !== null && member.age !== undefined ? ` • ${member.age} ${t('years', 'Yrs')}` : ''}
            </Text>
          </View>
          {hasPending && (
            <TouchableOpacity 
              style={styles.completeAllBtn}
              onPress={() => handleCompleteAllForMember(member.memberId, member.tasks)}
            >
              <Text style={styles.completeAllBtnText}>✓ {t('completeAll', 'Complete All')}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ marginTop: 8 }}>
          {member.tasks.map(renderSubTask)}
        </View>
      </View>
    );
  };

  const renderHousehold = (hh) => {
    const isExpanded = !!expandedHouseholds[hh.key];
    return (
      <View key={hh.key} style={styles.householdCard}>
        <TouchableOpacity 
          style={[styles.householdHeader, hh.hasHighRisk && styles.householdHeaderHighRisk]}
          onPress={() => toggleHouseholdExpanded(hh.key)}
          activeOpacity={0.8}
        >
          <View style={[styles.householdIconBox, { backgroundColor: hh.hasHighRisk ? '#FEE2E2' : '#EEF2FF' }]}>
            <Text style={styles.householdIconText}>{hh.hasHighRisk ? '🚨' : '🏠'}</Text>
          </View>
          
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <Text style={styles.householdTitle}>{t('houseNo', 'House')}: {hh.houseNo}</Text>
              {hh.hasHighRisk && (
                <View style={styles.highRiskBadge}>
                  <Text style={styles.highRiskBadgeText}>{t('highRisk', 'High Risk')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.householdHead}>{hh.headName}</Text>
            <Text style={styles.householdSubText}>{hh.villageName} • {hh.pendingCount} {t('pending', 'Pending')}</Text>
          </View>
          
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.householdBody}>
            {Object.values(hh.members).map(renderMember)}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t('dueList')}</Text>
          <Text style={styles.headerSubtitle}>{villageName} • {new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Global workload counters based on total loaded tasks */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{tasks.length}</Text>
          <Text style={styles.summaryLabel}>{t('totalCoverage')}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.error }]}>
            {tasks.filter(t => t.priority === 'High' && t.status !== 'completed').length}
          </Text>
          <Text style={styles.summaryLabel}>{t('highRisk')}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>
            {tasks.filter(t => t.status === 'completed').length}
          </Text>
          <Text style={styles.summaryLabel}>{t('success')}</Text>
        </View>
      </View>

      {/* Filters UI */}
      <View style={styles.filtersSection}>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder={t('searchHouseName', 'Search by House No, Member Name...')}
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Status Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'pending' && styles.activeFilterChip]} 
            onPress={() => setFilterStatus('pending')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'pending' && styles.activeFilterChipText]}>
              {t('pending', 'Pending')} ({tasks.filter(t => t.status !== 'completed').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'completed' && styles.activeFilterChip]} 
            onPress={() => setFilterStatus('completed')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'completed' && styles.activeFilterChipText]}>
              {t('success', 'Completed')} ({tasks.filter(t => t.status === 'completed').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'all' && styles.activeFilterChip]} 
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'all' && styles.activeFilterChipText]}>
              {t('all', 'All')} ({tasks.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Priority & Time filters row */}
        <View style={styles.secondaryFiltersRow}>
          {/* Priority Toggle */}
          <TouchableOpacity 
            style={[styles.smallFilterChip, filterPriority === 'high' && styles.activeRedFilterChip]}
            onPress={() => setFilterPriority(prev => prev === 'high' ? 'all' : 'high')}
          >
            <Text style={[styles.smallFilterChipText, filterPriority === 'high' && styles.activeRedFilterChipText]}>
              🚨 {t('highRisk', 'High Risk')}
            </Text>
          </TouchableOpacity>

          {/* Time Limit Chips */}
          <TouchableOpacity 
            style={[styles.smallFilterChip, filterTime === 'active_pending' && styles.activeFilterChip]}
            onPress={() => setFilterTime('active_pending')}
          >
            <Text style={[styles.smallFilterChipText, filterTime === 'active_pending' && styles.activeFilterChipText]}>
              🌟 {t('activePending', 'Active')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.smallFilterChip, filterTime === 'past_tasks' && styles.activeFilterChip]}
            onPress={() => setFilterTime('past_tasks')}
          >
            <Text style={[styles.smallFilterChipText, filterTime === 'past_tasks' && styles.activeFilterChipText]}>
              📁 {t('pastTasks', 'Past Tasks')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.smallFilterChip, filterTime === 'all' && styles.activeFilterChip]}
            onPress={() => setFilterTime('all')}
          >
            <Text style={[styles.smallFilterChipText, filterTime === 'all' && styles.activeFilterChipText]}>
              {t('all', 'All Time')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.smallFilterChip, filterTime === 'today_overdue' && styles.activeFilterChip]}
            onPress={() => setFilterTime('today_overdue')}
          >
            <Text style={[styles.smallFilterChipText, filterTime === 'today_overdue' && styles.activeFilterChipText]}>
              ⌛ {t('due', 'Due/Overdue')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.smallFilterChip, filterTime === 'this_week' && styles.activeFilterChip]}
            onPress={() => setFilterTime('this_week')}
          >
            <Text style={[styles.smallFilterChipText, filterTime === 'this_week' && styles.activeFilterChipText]}>
              📅 {t('thisWeek', 'This Week')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Household Group List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {householdList.length > 0 ? (
            householdList.map(renderHousehold)
          ) : (
            <Text style={styles.emptyText}>{t('noTasksToday', 'No matching tasks found.')}</Text>
          )}
        </ScrollView>
      )}

      {/* Modals removed in favor of Expandable Inline Forms */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 24,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 10,
    marginRight: 10,
  },
  backBtnText: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filtersSection: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
  },
  searchBar: {
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  filterChipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    height: 36,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeFilterChipText: {
    color: '#FFF',
  },
  secondaryFiltersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  smallFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeRedFilterChip: {
    backgroundColor: '#FEE2E2',
  },
  smallFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeRedFilterChipText: {
    color: COLORS.error,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  householdCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  householdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  householdHeaderHighRisk: {
    borderLeftColor: COLORS.error,
  },
  householdIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  householdIconText: {
    fontSize: 22,
  },
  householdTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  highRiskBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  highRiskBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.error,
  },
  householdHead: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  householdSubText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 10,
  },
  householdBody: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  memberBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  memberTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  memberSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  completeAllBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  completeAllBtnText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  subTaskCard: {
    backgroundColor: '#FAFBFD',
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  subTaskInfo: {
    flex: 1,
  },
  subTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subTaskService: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  subTaskDueDate: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  subTaskDueDateOverdue: {
    color: COLORS.error,
    fontWeight: '800',
  },
  subTaskDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  subTaskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  whatsappBtn: {
    marginLeft: 8,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  whatsappIcon: {
    fontSize: 12,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  actionButtonDone: {
    backgroundColor: '#E0E0E0',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  modalBody: {
    padding: 24,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  descriptionBox: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  visitSummaryBox: {
    backgroundColor: '#F0F7F0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  summaryValueText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    marginTop: 16,
  },
  evidenceImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  modalActions: {
    gap: 12,
  },
  statusToggleBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusToggleText: {
    fontSize: 16,
    fontWeight: '700',
  },
  completionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cameraBtnText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  capturedImageContainer: {
    alignItems: 'center',
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  retakeBtn: {
    marginTop: 12,
    padding: 8,
  },
  retakeBtnText: {
    color: COLORS.error,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default DailyTaskListScreen;


