import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
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
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { calculateMaternalSchedule, calculateChildSchedule, calculateVaccinationSchedule } from '../utils/healthLogic';
import { useTranslation } from 'react-i18next';
import { generateAllTasks } from '../utils/healthLogic';

const DailyTaskListScreen = ({ user, villageName, onBack }) => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadTasksFromStorage();
  }, []);

  const loadTasksFromStorage = async () => {
    setLoading(true);
    const allMembers = await storage.getAll(STORAGE_KEYS.MEMBERS);
    
    // Hierarchy filtering - only show tasks for user's scope
    let members = allMembers;
    if (user?.role === 'ASHA') {
      members = allMembers.filter(m => m.ashaId === user.id || m.villageId === user.villageId);
    } else if (user?.role === 'ANM') {
      members = allMembers.filter(m => m.subCenterId === user.subCenterId);
    } else if (user?.role === 'MO') {
      members = allMembers.filter(m => m.phcId === user.phcId);
    }

    const generatedTasks = generateAllTasks(members);

    const sortedTasks = generatedTasks.sort((a, b) => {
      if (a.priority === 'High' && b.priority !== 'High') return -1;
      if (a.priority !== 'High' && b.priority === 'High') return 1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    setTasks(sortedTasks);
    setLoading(false);
  };

  const [selectedTask, setSelectedTask] = useState(null);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [completionData, setCompletionData] = useState({
    reasoning: '',
    image: null,
  });

  const handleStatusChange = (task) => {
    if (task.status === 'completed') {
      toggleTaskStatus(task.id);
    } else {
      setSelectedTask(task);
      setCompletionModalVisible(true);
      setCompletionData({ reasoning: '', image: null });
    }
  };

  const toggleTaskStatus = (id) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        return { 
          ...task, 
          status: task.status === 'completed' ? 'pending' : 'completed',
          visitSummary: task.status === 'completed' ? null : completionData.reasoning,
          visitImage: task.status === 'completed' ? null : completionData.image,
        };
      }
      return task;
    }));
    setCompletionModalVisible(false);
    setSelectedTask(null);
  };

  const submitCompletion = async (taskOverride = null, isQuick = false) => {
    const taskToComplete = taskOverride || selectedTask;
    const reasoningToSave = isQuick ? 'Routine task completed' : completionData.reasoning;

    if (!isQuick && !reasoningToSave.trim()) {
      if (Platform.OS === 'web') window.alert('Please provide a visit summary.');
      else Alert.alert(t('error'), 'Please provide a visit summary.');
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
        await storage.save(STORAGE_KEYS.MEMBERS, member);
        
        await storage.addToSyncQueue('task_completions', {
          taskId: taskToComplete.id,
          memberId: member.id,
          completedAt: new Date().toISOString(),
          reasoning: reasoningToSave,
          image: isQuick ? null : completionData.image
        });
      }
      
      // Update UI state using toggleTaskStatus logic
      setTasks(tasks.map(task => {
        if (task.id === taskToComplete.id) {
          return { 
            ...task, 
            status: 'completed',
            visitSummary: reasoningToSave,
            visitImage: isQuick ? null : completionData.image,
          };
        }
        return task;
      }));
      setCompletionModalVisible(false);
      setSelectedTask(null);
      
      if (!isQuick) {
        if (Platform.OS === 'web') window.alert('Task marked as completed.');
        else Alert.alert(t('success'), 'Task marked as completed.');
      }
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') window.alert('Failed to save task completion.');
      else Alert.alert(t('error'), 'Failed to save task completion.');
    }
  };

  const handleWhatsApp = (task) => {
    let message = '';
    const taskType = task.serviceType.toLowerCase();
    
    if (taskType.includes('vaccination') || taskType.includes('vax')) {
      message = `नमस्कार ${task.memberName}, उद्या तुमच्या बाळाच्या लसीकरणाची तारीख आहे. कृपया लसीकरण केंद्रावर वेळेवर उपस्थित राहा.`;
    } else if (taskType.includes('anc') || taskType.includes('pregnancy')) {
      message = `नमस्कार ${task.memberName}, उद्या तुमची गरोदरपणातील तपासणी (ANC) आहे. कृपया आरोग्य केंद्रावर वेळेवर उपस्थित राहा.`;
    } else {
      message = `नमस्कार ${task.memberName}, उद्या तुमची वैद्यकीय तपासणीची तारीख आहे. कृपया अंगणवाडीत/आरोग्य केंद्रावर वेळेवर या.`;
    }
    
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
  };

  const mockCaptureImage = () => {
    setCompletionData({ ...completionData, image: 'https://via.placeholder.com/300x200?text=Visit+Evidence' });
  };

  const renderTask = ({ item }) => (
    <TouchableOpacity 
      style={styles.taskCard}
      onPress={() => setSelectedTask(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.statusIndicator, { backgroundColor: item.status === 'completed' ? COLORS.success : (item.priority === 'High' ? COLORS.error : COLORS.primary) }]} />
      <View style={styles.taskInfo}>
        <View style={styles.taskHeader}>
          <Text style={styles.memberName}>{item.memberName}</Text>
          <Text style={styles.houseLabel}>{t('houseNo')}: {item.houseNo}</Text>
        </View>
        <Text style={styles.serviceType}>{item.serviceType}</Text>
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, { color: item.status === 'completed' ? COLORS.success : COLORS.accent }]}>
            ● {item.status.toUpperCase()}
          </Text>
          {item.status !== 'completed' && (
            <TouchableOpacity onPress={() => handleWhatsApp(item)} style={styles.whatsappBtn}>
              <Text style={styles.whatsappIcon}>💬</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.actionButton, item.status === 'completed' && styles.actionButtonDone]}
        onPress={() => handleStatusChange(item)}
        onLongPress={() => {
          if (item.status !== 'completed') submitCompletion(item, true);
        }}
      >
        <Text style={styles.actionButtonText}>{item.status === 'completed' ? 'Reset' : 'Done'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

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

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{tasks.length}</Text>
          <Text style={styles.summaryLabel}>{t('totalCoverage')}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.error }]}>
            {tasks.filter(t => t.priority === 'High').length}
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

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No tasks for today!</Text>}
      />

      {/* Task Details Modal */}
      <Modal
        visible={selectedTask !== null && !completionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTask(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Task Details</Text>
              <TouchableOpacity onPress={() => setSelectedTask(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedTask && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Member Name</Text>
                  <Text style={styles.detailValue}>{selectedTask.memberName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Service Required</Text>
                  <Text style={styles.detailValue}>{selectedTask.serviceType}</Text>
                </View>
                
                <View style={styles.descriptionBox}>
                  <Text style={styles.detailLabel}>Task Instructions</Text>
                  <Text style={styles.descriptionText}>{selectedTask.details}</Text>
                </View>

                {selectedTask.status === 'completed' && (
                  <View style={styles.visitSummaryBox}>
                    <Text style={styles.detailLabel}>Visit Summary</Text>
                    <Text style={styles.summaryValueText}>{selectedTask.visitSummary}</Text>
                    {selectedTask.visitImage && (
                      <View style={styles.imagePreviewContainer}>
                        <Text style={styles.detailLabel}>Evidence Capture</Text>
                        <Image source={{ uri: selectedTask.visitImage }} style={styles.evidenceImage} />
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.statusToggleBtn, { backgroundColor: selectedTask.status === 'completed' ? '#f0f0f0' : COLORS.success }]}
                    onPress={() => handleStatusChange(selectedTask)}
                  >
                    <Text style={[styles.statusToggleText, { color: selectedTask.status === 'completed' ? COLORS.text : '#FFF' }]}>
                      {selectedTask.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Completion & Reasoning Modal */}
      <Modal
        visible={completionModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCompletionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Visit</Text>
              <TouchableOpacity onPress={() => setCompletionModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.completionHeading}>Confirm details for {selectedTask?.memberName}</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Visit Summary / Reasoning *</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="What was the outcome of the visit? (e.g. Meds given, BP normal, Patient referred)"
                  multiline
                  numberOfLines={4}
                  value={completionData.reasoning}
                  onChangeText={(text) => setCompletionData({ ...completionData, reasoning: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Evidence Capture {selectedTask?.requiresImage ? '*' : '(Optional)'}
                </Text>
                <Text style={styles.imageInstructions}>{selectedTask?.imageLabel || 'Capture an image of the visit or medical records'}</Text>
                
                {completionData.image ? (
                  <View style={styles.capturedImageContainer}>
                    <Image source={{ uri: completionData.image }} style={styles.capturedImage} />
                    <TouchableOpacity 
                      style={styles.retakeBtn}
                      onPress={() => setCompletionData({ ...completionData, image: null })}
                    >
                      <Text style={styles.retakeBtnText}>Retake Photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.cameraBtn}
                    onPress={mockCaptureImage}
                  >
                    <Text style={styles.cameraIcon}>📷</Text>
                    <Text style={styles.cameraBtnText}>Open Camera</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity 
                style={styles.submitBtn}
                onPress={submitCompletion}
              >
                <Text style={styles.submitBtnText}>Submit & Mark Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  listContent: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIndicator: {
    width: 6,
    height: '100%',
    borderRadius: 3,
    marginRight: 16,
  },
  taskInfo: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  houseLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  serviceType: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statusBadge: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  whatsappBtn: {
    marginLeft: 10,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  whatsappIcon: {
    fontSize: 14,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonDone: {
    backgroundColor: '#E0E0E0',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: COLORS.textSecondary,
    fontSize: 16,
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
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    height: 100,
    textAlignVertical: 'top',
  },
  imageInstructions: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  cameraBtn: {
    height: 120,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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


