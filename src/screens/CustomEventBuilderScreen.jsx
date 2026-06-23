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
  FlatList,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { useTranslation } from 'react-i18next';

const CustomEventBuilderScreen = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [schemas, setSchemas] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [fields, setFields] = useState([]);

  useEffect(() => {
    loadSchemas();
  }, []);

  const loadSchemas = async () => {
    const data = await storage.getAll(STORAGE_KEYS.CUSTOM_FORM_SCHEMAS);
    setSchemas(data);
  };

  const handleAddField = () => {
    setFields([...fields, { id: Date.now().toString(), label: '', type: 'text', required: false }]);
  };

  const handleUpdateField = (index, key, value) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const handleRemoveField = (index) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleSaveSchema = async () => {
    if (!formTitle.trim()) {
      Alert.alert(t('error'), 'Form Title is required.');
      return;
    }
    if (fields.length === 0) {
      Alert.alert(t('error'), 'Please add at least one field.');
      return;
    }

    // Validate fields
    for (let f of fields) {
      if (!f.label.trim()) {
        Alert.alert(t('error'), 'All fields must have a label.');
        return;
      }
    }

    const newSchema = {
      id: storage.generateId('schema', user?.id),
      title: formTitle,
      description: formDesc,
      fields: fields,
      createdBy: user?.id,
      createdAt: new Date().toISOString(),
      active: true,
    };

    await storage.save(STORAGE_KEYS.CUSTOM_FORM_SCHEMAS, newSchema);
    Alert.alert(t('success'), 'Custom form schema created successfully.');
    setIsCreating(false);
    setFormTitle('');
    setFormDesc('');
    setFields([]);
    loadSchemas();
  };

  const renderSchemaItem = ({ item }) => (
    <View style={styles.schemaCard}>
      <Text style={styles.schemaTitle}>{item.title}</Text>
      <Text style={styles.schemaDesc}>{item.description}</Text>
      <Text style={styles.schemaFieldsCount}>{item.fields?.length || 0} Fields</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Custom Form Builder</Text>
      </View>

      {!isCreating ? (
        <View style={styles.content}>
          <TouchableOpacity style={styles.createBtn} onPress={() => setIsCreating(true)}>
            <Text style={styles.createBtnText}>+ Create New Form</Text>
          </TouchableOpacity>

          <FlatList
            data={schemas}
            renderItem={renderSchemaItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No custom forms found.</Text>}
          />
        </View>
      ) : (
        <ScrollView style={styles.builderContainer}>
          <Text style={styles.sectionTitle}>Form Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={formTitle} onChangeText={setFormTitle} placeholder="e.g. Flood Relief Survey" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput style={styles.input} value={formDesc} onChangeText={setFormDesc} placeholder="Optional instructions..." />
          </View>

          <Text style={styles.sectionTitle}>Form Fields</Text>
          {fields.map((field, index) => (
            <View key={field.id} style={styles.fieldCard}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldTitle}>Field {index + 1}</Text>
                <TouchableOpacity onPress={() => handleRemoveField(index)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Label</Text>
                <TextInput style={styles.input} value={field.label} onChangeText={(t) => handleUpdateField(index, 'label', t)} placeholder="e.g. Water Level" />
              </View>

              <View style={styles.typeRow}>
                {['text', 'number', 'boolean'].map(type => (
                  <TouchableOpacity 
                    key={type} 
                    style={[styles.typeBtn, field.type === type && styles.typeBtnActive]}
                    onPress={() => handleUpdateField(index, 'type', type)}
                  >
                    <Text style={[styles.typeText, field.type === type && styles.typeTextActive]}>{type.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addFieldBtn} onPress={handleAddField}>
            <Text style={styles.addFieldText}>+ Add Field</Text>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreating(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSchema}>
              <Text style={styles.saveBtnText}>Save Form Schema</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 10, marginRight: 10 },
  backBtnText: { fontSize: 24, color: '#FFF', fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  content: { flex: 1 },
  createBtn: { margin: 16, backgroundColor: COLORS.secondary, padding: 16, borderRadius: 12, alignItems: 'center' },
  createBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textSecondary },
  schemaCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  schemaTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  schemaDesc: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  schemaFieldsCount: { fontSize: 12, color: COLORS.primary, marginTop: 8, fontWeight: '600' },
  
  builderContainer: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: { height: 48, backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#EEE' },
  
  fieldCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#EEE' },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  fieldTitle: { fontWeight: '700', color: COLORS.text },
  removeText: { color: COLORS.error, fontSize: 12, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  typeTextActive: { color: '#FFF' },

  addFieldBtn: { backgroundColor: '#E0E7FF', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  addFieldText: { color: COLORS.primary, fontWeight: '700' },

  actions: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#F1F5F9' },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '700' },
  saveBtn: { flex: 2, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.primary },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});

export default CustomEventBuilderScreen;
