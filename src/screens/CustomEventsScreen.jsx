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
  Switch,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { storage, STORAGE_KEYS } from '../database/storage';
import { useTranslation } from 'react-i18next';

const CustomEventsScreen = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [schemas, setSchemas] = useState([]);
  const [activeSchema, setActiveSchema] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadSchemas();
  }, []);

  const loadSchemas = async () => {
    const data = await storage.getAll(STORAGE_KEYS.CUSTOM_FORM_SCHEMAS);
    setSchemas(data.filter(s => s.active));
  };

  const handleSelectSchema = (schema) => {
    setActiveSchema(schema);
    const initialData = {};
    schema.fields.forEach(f => {
      initialData[f.id] = f.type === 'boolean' ? false : '';
    });
    setFormData(initialData);
  };

  const handleSubmit = async () => {
    const newEvent = {
      id: storage.generateId('custevt', user?.id),
      schemaId: activeSchema.id,
      schemaTitle: activeSchema.title,
      responses: formData,
      ashaId: user?.id,
      villageId: user?.villageId,
      timestamp: new Date().toISOString(),
    };

    await storage.save(STORAGE_KEYS.CUSTOM_EVENTS, newEvent);
    Alert.alert(t('success'), `${activeSchema.title} submitted successfully.`);
    setActiveSchema(null);
  };

  const renderSchemaItem = ({ item }) => (
    <TouchableOpacity style={styles.schemaCard} onPress={() => handleSelectSchema(item)}>
      <Text style={styles.schemaTitle}>{item.title}</Text>
      <Text style={styles.schemaDesc}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={activeSchema ? () => setActiveSchema(null) : onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activeSchema ? activeSchema.title : 'Custom Forms'}</Text>
      </View>

      {!activeSchema ? (
        <FlatList
          data={schemas}
          renderItem={renderSchemaItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No active custom forms available.</Text>}
        />
      ) : (
        <ScrollView style={styles.formContainer}>
          <Text style={styles.formDesc}>{activeSchema.description}</Text>

          {activeSchema.fields.map(field => (
            <View key={field.id} style={styles.inputGroup}>
              <Text style={styles.label}>{field.label}</Text>
              
              {field.type === 'boolean' ? (
                <View style={styles.switchContainer}>
                  <Switch
                    value={formData[field.id]}
                    onValueChange={(val) => setFormData({ ...formData, [field.id]: val })}
                    trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
                  />
                  <Text style={styles.switchText}>{formData[field.id] ? 'Yes' : 'No'}</Text>
                </View>
              ) : (
                <TextInput
                  style={styles.input}
                  value={String(formData[field.id])}
                  onChangeText={(val) => setFormData({ ...formData, [field.id]: val })}
                  keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Submit Form</Text>
          </TouchableOpacity>
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
  
  schemaCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  schemaTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  schemaDesc: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textSecondary },

  formContainer: { padding: 16 },
  formDesc: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: { height: 48, backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#EEE' },
  switchContainer: { flexDirection: 'row', alignItems: 'center' },
  switchText: { marginLeft: 10, fontSize: 16, color: COLORS.text },

  submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});

export default CustomEventsScreen;
