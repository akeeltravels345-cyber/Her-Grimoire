import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import GradientScreen from '../components/GradientScreen';
import IconColorGrid from '../components/IconColorGrid';
import { resolveCategoryColor } from '../utils/categoryHelpers';
import { useForm } from '../hooks/useForm';
import { validateCategoryName } from '../utils/validationHelpers';

import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../constants/config';

export default function ManageCategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categories, categoryColors, addCategory, deleteCategory } = useApp();
  const { showToast } = useToast();

  const [isAdding, setIsAdding] = useState(false);

  const form = useForm({
    initialValues: {
      newName: '',
      newIcon: AVAILABLE_ICONS[0],
      newColor: AVAILABLE_COLORS[0],
      newDescription: '',
    },
    validate: (values) => {
      const error = validateCategoryName(values.newName);
      return error ? [{ field: 'newName', message: error }] : [];
    },
    onSubmit: async () => { await new Promise(r => setTimeout(r, 100)); },
  });

  const handleAddCategory = () => {
    // Validate form before attempting to add
    if (form.hasErrors()) {
      const firstError = form.errors[0];
      showToast(firstError.message, 'error', { duration: 4000 });
      return;
    }

    if (!form.values.newName.trim()) {
      showToast('Please enter a category name', 'error', { duration: 4000 });
      return;
    }

    try {
      const id = form.values.newName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      addCategory({
        id,
        name: form.values.newName.trim(),
        icon: form.values.newIcon,
        description: form.values.newDescription.trim(),
      }, form.values.newColor);
      showToast(`"${form.values.newName}" added!`, 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      form.reset();
      setIsAdding(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add category. Please try again.';
      showToast(errorMessage, 'error', { duration: 4000 });
      console.error('[handleAddCategory] Error:', error);
    }
  };

  const handleDelete = (catId: string) => {
    deleteCategory(catId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  return (
    <GradientScreen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Categories</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Your Categories</Text>

          {categories.map(cat => {
            const catColor = resolveCategoryColor(cat.id, categoryColors, categories);
            return (
              <View key={cat.id} style={styles.categoryItem}>
                <View style={[styles.categoryIconBox, { backgroundColor: catColor + '20' }]}>
                  <MaterialIcons name={cat.icon as keyof typeof MaterialIcons.glyphMap} size={22} color={catColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  {cat.description ? <Text style={styles.categoryDesc}>{cat.description}</Text> : null}
                </View>
                <Pressable style={styles.deleteBtn} onPress={() => handleDelete(cat.id)}>
                  <MaterialIcons name="close" size={18} color={theme.error} />
                </Pressable>
              </View>
            );
          })}

          {!isAdding ? (
            <Pressable style={styles.addCategoryBtn} onPress={() => setIsAdding(true)}>
              <MaterialIcons name="add-circle-outline" size={22} color={theme.primary} />
              <Text style={styles.addCategoryText}>Add Category</Text>
            </Pressable>
          ) : (
            <View style={styles.addForm}>
              <Text style={styles.formLabel}>Category Name</Text>
              <TextInput style={styles.input} value={form.values.newName} onChangeText={form.handleChange('newName')} placeholder="e.g., Shadow Work" placeholderTextColor={theme.textMuted} />
              {form.getFieldError('newName') && <Text style={styles.errorText}>{form.getFieldError('newName')}</Text>}

              <Text style={styles.formLabel}>Description</Text>
              <TextInput style={styles.input} value={form.values.newDescription} onChangeText={form.handleChange('newDescription')} placeholder="Brief description..." placeholderTextColor={theme.textMuted} />

              <IconColorGrid
                icons={AVAILABLE_ICONS}
                colors={AVAILABLE_COLORS}
                selectedIcon={form.values.newIcon}
                selectedColor={form.values.newColor}
                onIconChange={(icon) => form.setFieldValue('newIcon', icon)}
                onColorChange={(color) => form.setFieldValue('newColor', color)}
              />

              <View style={styles.formActions}>
                <Pressable style={styles.cancelBtn} onPress={() => setIsAdding(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.confirmBtn, (!form.values.newName.trim() || form.isSubmitting) && { opacity: 0.5 }]} onPress={handleAddCategory} disabled={!form.values.newName.trim() || form.isSubmitting}>
                  <Text style={styles.confirmBtnText}>Add Category</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.textPrimary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginTop: 20, marginBottom: 16 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: theme.radius.md, padding: 16, marginBottom: 10, gap: 14, ...theme.shadows.card },
  categoryIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
  categoryDesc: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.error + '15', alignItems: 'center', justifyContent: 'center' },
  addCategoryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderWidth: 1.5, borderColor: theme.primary + '40', borderRadius: theme.radius.md, borderStyle: 'dashed', marginTop: 8 },
  addCategoryText: { fontSize: 15, fontWeight: '600', color: theme.primary },
  addForm: { backgroundColor: theme.surface, borderRadius: theme.radius.md, padding: 20, marginTop: 8, ...theme.shadows.card },
  formLabel: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  errorText: { fontSize: 12, color: theme.error, marginTop: -4, marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: theme.backgroundSecondary, borderRadius: theme.radius.sm, padding: 12, fontSize: 15, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: theme.radius.sm, backgroundColor: theme.surfaceLight, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: theme.radius.sm, backgroundColor: theme.primary, alignItems: 'center' },
  confirmBtnText: { fontSize: 14, fontWeight: '600', color: theme.background },
});
