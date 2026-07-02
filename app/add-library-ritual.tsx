import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { useAlert } from '@/template';
import StarField from '../components/StarField';
import { resolveCategoryColor } from '../utils/categoryHelpers';
import ImageField from '../components/ImageField';
import ImageUploadButton from '../components/ImageUploadButton';
import ImageDisplay from '../components/ImageDisplay';
import { useForm } from '../hooks/useForm';
import { validateRitualForm } from '../utils/validationHelpers';

export default function AddLibraryRitualScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addLibraryRitual, categories, categoryColors, deleteCategory, deities, deityColors } = useApp();
  const { showToast } = useToast();
  const { showAlert } = useAlert();

  const form = useForm({
    initialValues: {
      name: '',
      selectedCategories: [categories[0]?.id || ''] as string[],
      selectedDeities: [] as string[],
      description: '',
      intention: '',
      ingredients: '',
      imageUrl: undefined as string | undefined,
      referenceImages: [] as string[],
    },
    validate: (values) => {
      const errors = validateRitualForm({
        name: values.name,
        intention: values.intention,
        categories: values.selectedCategories,
        schedule: 'as_needed',
        description: values.description,
        ingredients: values.ingredients,
      });
      return errors.map(e => ({
        ...e,
        field: e.field === 'categories' ? 'selectedCategories' : e.field
      }));
    },
    onSubmit: async () => { await new Promise(r => setTimeout(r, 100)); },
  });

  const [showPracticePrompt, setShowPracticePrompt] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const canSave = !form.hasErrors() && form.values.name.trim().length > 0 && form.values.selectedCategories.length > 0 && !form.isSubmitting;

  const handleSaveLibrary = async () => {
    if (form.isSubmitting) return;

    // Validate form before attempting to save
    if (form.hasErrors()) {
      const firstError = form.errors[0];
      showToast(firstError.message, 'error', { duration: 4000 });
      return;
    }

    if (!form.values.name.trim()) {
      showToast('Please enter a ritual name', 'error', { duration: 4000 });
      return;
    }

    if (!form.values.selectedCategories.length) {
      showToast('Please select at least one category', 'error', { duration: 4000 });
      return;
    }

    try {
      const id = addLibraryRitual({
        name: form.values.name.trim(),
        categories: form.values.selectedCategories,
        deities: form.values.selectedDeities.length > 0 ? form.values.selectedDeities : undefined,
        description: form.values.description.trim(),
        intention: form.values.intention.trim(),
        tangibleOutcome: '',
        ingredients: form.values.ingredients.trim() ? form.values.ingredients.split(',').map(i => i.trim()).filter(Boolean) : undefined,
        schedule: 'as_needed',
        imageUrl: form.values.imageUrl,
        referenceImages: form.values.referenceImages.length > 0 ? form.values.referenceImages : undefined,
      });
      showToast(`"${form.values.name}" added to library!`, 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSavedId(id ?? null);
      setShowPracticePrompt(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save to library. Please try again.';
      showToast(errorMessage, 'error', { duration: 4000 });
      console.error('[handleSaveLibrary] Error:', error);
    }
  };

  const handleAddToPractice = () => {
    setShowPracticePrompt(false);
    if (savedId) {
      router.replace({ pathname: '/add-to-practice', params: { libraryId: savedId } });
    } else {
      router.back();
    }
  };

  const handleSkip = () => {
    setShowPracticePrompt(false);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <LinearGradient
        colors={[theme.primary + '28', theme.primary + '10', 'transparent']}
        locations={[0, 0.4, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320, zIndex: 0 }}
        pointerEvents="none"
      />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <StarField starCount={40} showShootingStar={false} />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Add to Library</Text>
          <Pressable onPress={handleSaveLibrary} style={[styles.saveBtn, (!canSave || form.isSubmitting) && styles.saveBtnDisabled]} disabled={!canSave || form.isSubmitting}>
            <Text style={[styles.saveBtnText, (!canSave || form.isSubmitting) && styles.saveBtnTextDisabled]}>Save</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.subtitleWrap}>
              <MaterialIcons name="auto-stories" size={18} color={theme.textMuted} />
              <Text style={styles.subtitle}>Save this spell to your grimoire. Only a name is needed — fill in the rest later.</Text>
            </View>

            {/* Feature Image Upload */}
            <ImageField
              imageUrl={form.values.imageUrl}
              onImageChange={(url) => form.setFieldValue('imageUrl', url)}
              fieldLabel="Featured Image"
              hint="Optional — the main image for this spell"
              uploadLabel="Add Featured Image"
              showCameraOption={true}
              previewSize={200}
            />

            {/* Name — only required field */}
            <Text style={styles.label}>Spell Name *</Text>
            <TextInput
              style={styles.input}
              value={form.values.name}
              onChangeText={form.handleChange('name')}
              placeholder="e.g., Full Moon Abundance Spell"
              placeholderTextColor={theme.textMuted}
            />
            {form.getFieldError('name') && <Text style={styles.errorText}>{form.getFieldError('name')}</Text>}

            {/* Category - Multi-select */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.label}>Categories (min 1, max 3)</Text>
              {form.values.selectedCategories.length > 0 && (
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted }}>{form.values.selectedCategories.length} of 3</Text>
              )}
            </View>
            <View style={styles.categoryGrid}>
              {categories.map(cat => {
                const catColor = resolveCategoryColor(cat.id, categoryColors, categories);
                const isSelected = form.values.selectedCategories.includes(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      isSelected && { backgroundColor: catColor + '20', borderColor: catColor },
                      form.values.selectedCategories.length >= 3 && !isSelected && { opacity: 0.5 }
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        if (form.values.selectedCategories.length > 1) {
                          form.setFieldValue('selectedCategories', form.values.selectedCategories.filter(c => c !== cat.id));
                          Haptics.selectionAsync();
                        }
                      } else if (form.values.selectedCategories.length < 3) {
                        form.setFieldValue('selectedCategories', [...form.values.selectedCategories, cat.id]);
                        Haptics.selectionAsync();
                      }
                    }}
                    onLongPress={() => {
                      showAlert('Delete Category?', `Remove "${cat.name}" from your categories? This cannot be undone.`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => { deleteCategory(cat.id); if (form.values.selectedCategories.includes(cat.id)) form.setFieldValue('selectedCategories', form.values.selectedCategories.filter(c => c !== cat.id) || [categories[0]?.id || '']); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } },
                      ]);
                    }}
                    delayLongPress={500}
                  >
                    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialIcons name={cat.icon as keyof typeof MaterialIcons.glyphMap} size={22} color={isSelected ? catColor : theme.textMuted} />
                      {isSelected && (
                        <View style={{ position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: catColor, alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialIcons name="check" size={10} color="white" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.categoryOptionText, isSelected && { color: catColor }]}>{cat.name}</Text>
                  </Pressable>
                );
              })}
              <Pressable style={styles.newCategoryOption} onPress={() => router.push('/manage-categories')}>
                <MaterialIcons name="add" size={22} color={theme.textMuted} />
                <Text style={styles.newCategoryOptionText}>New</Text>
              </Pressable>
            </View>

            {/* Deities & Spiritual Beings - Multi-select (optional) */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.label}>Deities & Spiritual Beings (optional)</Text>
              {form.values.selectedDeities.length > 0 && (
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted }}>{form.values.selectedDeities.length} selected</Text>
              )}
            </View>
            <View style={styles.categoryGrid}>
              {deities.map(deity => {
                const deityColor = deityColors[deity.id] || theme.accent;
                const isSelected = form.values.selectedDeities.includes(deity.id);
                return (
                  <Pressable
                    key={deity.id}
                    style={[
                      styles.categoryOption,
                      isSelected && { backgroundColor: deityColor + '20', borderColor: deityColor }
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        form.setFieldValue('selectedDeities', form.values.selectedDeities.filter(d => d !== deity.id));
                      } else {
                        form.setFieldValue('selectedDeities', [...form.values.selectedDeities, deity.id]);
                      }
                      Haptics.selectionAsync();
                    }}
                  >
                    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialIcons name={deity.icon as keyof typeof MaterialIcons.glyphMap} size={22} color={isSelected ? deityColor : theme.textMuted} />
                      {isSelected && (
                        <View style={{ position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: deityColor, alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialIcons name="check" size={10} color="white" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.categoryOptionText, isSelected && { color: deityColor }]}>{deity.name}</Text>
                  </Pressable>
                );
              })}
              <Pressable style={styles.newCategoryOption} onPress={() => router.push('/manage-deities')}>
                <MaterialIcons name="add" size={22} color={theme.textMuted} />
                <Text style={styles.newCategoryOptionText}>New</Text>
              </Pressable>
            </View>

            {/* Optional fields */}
            <Text style={styles.sectionDivider}>OPTIONAL DETAILS</Text>

            <Text style={styles.label}>Intention</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.values.intention}
              onChangeText={form.handleChange('intention')}
              placeholder="What is the purpose of this spell?"
              placeholderTextColor={theme.textMuted}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Ritual Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.values.description}
              onChangeText={form.handleChange('description')}
              placeholder="Steps, process, special notes..."
              placeholderTextColor={theme.textMuted}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Ingredients & Tools</Text>
            <TextInput
              style={styles.input}
              value={form.values.ingredients}
              onChangeText={form.handleChange('ingredients')}
              placeholder="candle, herbs, crystal..."
              placeholderTextColor={theme.textMuted}
            />
            <Text style={styles.hint}>Separate items with commas</Text>

            {/* Reference Images */}
            <Text style={styles.label}>Reference Images</Text>
            <Text style={styles.imageLabelHint}>Optional — sigils, altar setups, inspiration, etc.</Text>

            {form.values.referenceImages.length > 0 && (
              <View style={styles.referenceImagesGrid}>
                {form.values.referenceImages.map((imgUrl, idx) => (
                  <View key={idx} style={styles.referenceImageItem}>
                    <ImageDisplay imageUri={imgUrl} size={100} />
                    <Pressable
                      style={styles.removeRefImageBtn}
                      onPress={() => form.setFieldValue('referenceImages', form.values.referenceImages.filter((_, i) => i !== idx))}
                    >
                      <MaterialIcons name="close" size={16} color={theme.background} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <ImageUploadButton
              onImageSelect={(url) => form.setFieldValue('referenceImages', [...form.values.referenceImages, url])}
              label={form.values.referenceImages.length > 0 ? "Add Another Reference" : "Add Reference Image"}
              showCameraOption={true}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Add to Practice prompt */}
      <Modal visible={showPracticePrompt} transparent animationType="fade">
        <View style={styles.promptOverlay}>
          <View style={styles.promptCard}>
            <Text style={styles.promptEmoji}>✨</Text>
            <Text style={styles.promptTitle}>"{form.values.name}" saved!</Text>
            <Text style={styles.promptSubtitle}>Do you want to add it to your practice now?</Text>
            <Pressable style={styles.promptPrimaryBtn} onPress={handleAddToPractice}>
              <Text style={styles.promptPrimaryBtnText}>Add to Practice</Text>
            </Pressable>
            <Pressable style={styles.promptSkipBtn} onPress={handleSkip}>
              <Text style={styles.promptSkipBtnText}>Save to Library Only</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.textPrimary },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, backgroundColor: theme.primary, borderRadius: theme.radius.sm },
  saveBtnDisabled: { backgroundColor: theme.surfaceLight },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: theme.background },
  saveBtnTextDisabled: { color: theme.textMuted },
  subtitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 4 },
  subtitle: { flex: 1, fontSize: 13, color: theme.textSecondary, lineHeight: 18, fontStyle: 'italic' },
  label: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  errorText: { fontSize: 12, color: theme.error, marginTop: -6, marginBottom: 8, marginLeft: 4, fontWeight: '500' },
  input: { backgroundColor: theme.surface, borderRadius: theme.radius.md, padding: 14, fontSize: 15, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border },
  textArea: { minHeight: 100, paddingTop: 14 },
  hint: { fontSize: 12, color: theme.textMuted, marginTop: 4, marginLeft: 4, fontStyle: 'italic' },
  sectionDivider: { fontSize: 11, fontWeight: '700', color: theme.textMuted, letterSpacing: 1.2, marginTop: 32, marginBottom: 4, textAlign: 'center' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.radius.md, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border },
  categoryOptionText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  newCategoryOption: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.radius.md, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.textMuted + '40', borderStyle: 'dashed' },
  newCategoryOptionText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  deityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  deityOption: { flexDirection: 'column', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: theme.radius.md, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border, width: '31%' },
  deityOptionText: { fontSize: 11, fontWeight: '600', color: theme.textMuted, textAlign: 'center' },
  newDeityOption: { flexDirection: 'column', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: theme.radius.md, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.textMuted + '40', borderStyle: 'dashed', width: '31%' },
  newDeityOptionText: { fontSize: 11, fontWeight: '600', color: theme.textMuted },

  imageLabelHint: { fontSize: 12, color: theme.textMuted, marginBottom: 12, fontStyle: 'italic' },

  referenceImagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  referenceImageItem: { position: 'relative' },
  removeRefImageBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: theme.error, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: theme.error, shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 },

  promptOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  promptCard: { backgroundColor: '#231248', borderRadius: 20, padding: 28, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: theme.primary + '30' },
  promptEmoji: { fontSize: 40, marginBottom: 12 },
  promptTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', marginBottom: 8 },
  promptSubtitle: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  promptPrimaryBtn: { width: '100%', backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  promptPrimaryBtnText: { fontSize: 15, fontWeight: '700', color: theme.background },
  promptSkipBtn: { width: '100%', paddingVertical: 12, alignItems: 'center' },
  promptSkipBtnText: { fontSize: 14, color: theme.textMuted, fontWeight: '500' },
});
