import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { useAlert } from '@/template';
import StarField from '../components/StarField';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { resolveCategoryColor } from '../utils/categoryHelpers';
import ImageField from '../components/ImageField';
import ConfirmationModal from '../components/ConfirmationModal';
import SimpleCalendarPicker from '../components/SimpleCalendarPicker';
import { useForm } from '../hooks/useForm';
import { validateRitualForm } from '../utils/validationHelpers';
import { formatDateWithShortDay, formatDateWithDayAndYear, formatShortDate, formatDateWithLongDay, formatWeekdayShort, formatMonthShort } from '../utils/dateHelpers';

const scheduleOptions = [
  { id: 'daily', label: 'Daily', icon: 'today' },
  { id: 'weekly', label: 'Weekly', icon: 'date-range' },
  { id: 'monthly', label: 'Monthly', icon: 'calendar-month' },
  { id: 'moon_phase', label: 'Moon Phase', icon: 'nightlight-round' },
  { id: 'as_needed', label: 'One Time', icon: 'more-time' },
] as const;

const MOON_PHASES = [
  { index: 0, name: 'New Moon', emoji: '🌑', energy: 'Intentions & new beginnings' },
  { index: 1, name: 'Waxing Crescent', emoji: '🌒', energy: 'Building momentum' },
  { index: 2, name: 'First Quarter', emoji: '🌓', energy: 'Taking action' },
  { index: 3, name: 'Waxing Gibbous', emoji: '🌔', energy: 'Refinement & growth' },
  { index: 4, name: 'Full Moon', emoji: '🌕', energy: 'Manifestation & release' },
  { index: 5, name: 'Waning Gibbous', emoji: '🌖', energy: 'Gratitude & sharing' },
  { index: 6, name: 'Last Quarter', emoji: '🌗', energy: 'Releasing & letting go' },
  { index: 7, name: 'Waning Crescent', emoji: '🌘', energy: 'Rest & surrender' },
];

function getNextMoonPhaseDate(targetPhaseIndex: number): Date {
  const LUNAR_CYCLE = 29.53058867;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const c = Math.floor(365.25 * year);
  const e = Math.floor(30.6 * month);
  const jd = c + e + day - 694039.09;
  const currentFraction = (((jd / LUNAR_CYCLE) % 1) + 1) % 1;
  const targetFraction = targetPhaseIndex / 8;
  let daysUntil = ((targetFraction - currentFraction) * LUNAR_CYCLE + LUNAR_CYCLE) % LUNAR_CYCLE;
  if (daysUntil < 1) daysUntil += LUNAR_CYCLE;
  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + Math.round(daysUntil));
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

const DATE_OPTIONS = (() => {
  const dates: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 30); // allow 30 days back
  for (let i = 0; i < 91; i++) {      // 30 past + today + 60 future
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
})();

export default function AddRitualScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addRitual, addLibraryRitual, libraryRituals, categories, categoryColors, deleteCategory, deities, deityColors } = useApp();
  const { showAlert } = useAlert();
  const { showToast } = useToast();

  const params = useLocalSearchParams<{ category?: string }>();

  // Form state management
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initialValues = {
    name: '',
    selectedCategories: params.category && categories.some(c => c.id === params.category) ? [params.category] : (categories[0] ? [categories[0].id] : []),
    selectedDeities: [] as string[],
    description: '',
    intention: '',
    tangibleOutcome: '',
    ingredients: '',
    schedule: 'as_needed' as 'daily' | 'weekly' | 'monthly' | 'moon_phase' | 'as_needed',
    scheduledDate: today,
    consecutiveDays: 1,
    moonPhaseSelection: null as number | null,
    imageUrl: undefined as string | undefined,
  };

  const form = useForm({
    initialValues,
    validate: (values) => {
      const errors = validateRitualForm({
        name: values.name,
        intention: values.intention,
        categories: values.selectedCategories,
        schedule: values.schedule,
        scheduledDate: values.scheduledDate?.toISOString(),
        tangibleOutcome: values.tangibleOutcome,
        description: values.description,
        ingredients: values.ingredients,
      });
      // Map field names from validator to form field names
      return errors.map(e => ({
        ...e,
        field: e.field === 'categories' ? 'selectedCategories' : e.field
      }));
    },
    onSubmit: async (values) => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
      // Will be overridden by handleSaveRitual
    },
  });

  const [showLibraryPrompt, setShowLibraryPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const needsDate = form.values.schedule !== 'as_needed' || form.values.consecutiveDays > 1;
  const needsMoonPhase = form.values.schedule === 'moon_phase';
  const canSave =
    !form.hasErrors() &&
    form.values.name.trim().length > 0 &&
    form.values.intention.trim().length > 0 &&
    form.values.selectedCategories.length > 0 && // At least one category required
    (!needsDate || form.values.scheduledDate !== null) &&
    (!needsMoonPhase || form.values.moonPhaseSelection !== null) &&
    !form.isSubmitting;

  const handleSaveRitual = async () => {
    if (form.isSubmitting || isSubmitting) return;

    // Validate form before attempting to save
    if (form.hasErrors()) {
      const firstError = form.errors[0];
      showToast(firstError.message, 'error', { duration: 4000 });
      return;
    }

    // Additional checks for required fields
    if (!form.values.name.trim()) {
      showToast('Please enter a ritual name', 'error', { duration: 4000 });
      return;
    }
    if (!form.values.intention.trim()) {
      showToast('Please describe your intention', 'error', { duration: 4000 });
      return;
    }
    if (!form.values.selectedCategories.length) {
      showToast('Please select at least one category', 'error', { duration: 4000 });
      return;
    }
    if (needsDate && !form.values.scheduledDate) {
      showToast('Please select a scheduled date', 'error', { duration: 4000 });
      return;
    }
    if (needsMoonPhase && form.values.moonPhaseSelection === null) {
      showToast('Please select a moon phase', 'error', { duration: 4000 });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('[handleSaveRitual] Starting ritual save', {
        name: form.values.name,
        categories: form.values.selectedCategories,
        schedule: form.values.schedule
      });

      // Build ritual object with all necessary fields
      const ritualData = {
        name: form.values.name.trim(),
        categories: form.values.selectedCategories,
        deities: form.values.selectedDeities.length > 0 ? form.values.selectedDeities : undefined,
        description: form.values.description.trim(),
        intention: form.values.intention.trim(),
        tangibleOutcome: form.values.tangibleOutcome.trim(),
        ingredients: form.values.ingredients.trim() ? form.values.ingredients.split(',').map(i => i.trim()).filter(Boolean) : undefined,
        schedule: form.values.schedule,
        scheduleDetail: form.values.schedule === 'moon_phase' && form.values.moonPhaseSelection !== null ? String(form.values.moonPhaseSelection) : undefined,
        scheduledDate: form.values.scheduledDate ? form.values.scheduledDate.toISOString() : undefined,
        consecutiveDays: form.values.consecutiveDays > 1 ? form.values.consecutiveDays : undefined,
        status: 'scheduled' as const,
        imageUrl: form.values.imageUrl,
      };

      console.log('[handleSaveRitual] Ritual data prepared:', ritualData);

      // Call addRitual
      addRitual(ritualData);
      console.log('[handleSaveRitual] addRitual called successfully');

      const alreadyInLibrary = libraryRituals.some(
        r => r.name.toLowerCase().trim() === form.values.name.toLowerCase().trim()
      );

      console.log('[handleSaveRitual] alreadyInLibrary check:', alreadyInLibrary);

      if (!alreadyInLibrary) {
        console.log('[handleSaveRitual] Showing library prompt');
        showToast(`"${form.values.name}" created!`, 'success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowLibraryPrompt(true);
      } else {
        console.log('[handleSaveRitual] Ritual already in library, navigating back');
        showToast(`"${form.values.name}" created!`, 'success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create ritual. Please try again.';
      showToast(errorMessage, 'error', { duration: 4000 });
      console.error('[handleSaveRitual] Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveToLibrary = () => {
    console.log('[handleSaveToLibrary] Adding to library');
    setShowLibraryPrompt(false);
    addLibraryRitual({
      name: form.values.name.trim(),
      categories: form.values.selectedCategories,
      deities: form.values.selectedDeities.length > 0 ? form.values.selectedDeities : undefined,
      description: form.values.description.trim(),
      intention: form.values.intention.trim(),
      tangibleOutcome: form.values.tangibleOutcome.trim(),
      ingredients: form.values.ingredients.trim() ? form.values.ingredients.split(',').map(i => i.trim()).filter(Boolean) : undefined,
      schedule: form.values.schedule,
      imageUrl: form.values.imageUrl,
    });
    showToast('Added to library!', 'success');
    console.log('[handleSaveToLibrary] Added to library');
    router.back();
  };

  const handleSkipLibrary = () => {
    console.log('[handleSkipLibrary] Skipping library');
    setShowLibraryPrompt(false);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Soft purple wash from the top */}
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
          <Text style={styles.headerTitle}>New Ritual</Text>
          <Pressable onPress={handleSaveRitual} style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} disabled={!canSave || form.isSubmitting}>
            <Text style={[styles.saveBtnText, (!canSave || form.isSubmitting) && styles.saveBtnTextDisabled]}>Save</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Name */}
            <Text style={styles.label}>Ritual Name *</Text>
            <TextInput style={styles.input} value={form.values.name} onChangeText={form.handleChange('name')} placeholder="e.g., Full Moon Abundance Spell" placeholderTextColor={theme.textMuted} />
            {form.getFieldError('name') && <Text style={styles.errorText}>{form.getFieldError('name')}</Text>}

            {/* Category - Multi-select (min 1, max 3) */}
            <View style={styles.categoryHeader}>
              <Text style={styles.label}>Categories (min 1, max 3)</Text>
              {form.values.selectedCategories.length > 0 && (
                <Text style={styles.categoryCounter}>{form.values.selectedCategories.length} of 3</Text>
              )}
            </View>
            {form.getFieldError('selectedCategories') && <Text style={styles.errorText}>{form.getFieldError('selectedCategories')}</Text>}
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
                        // Don't allow deselecting if it's the only one
                        if (form.values.selectedCategories.length > 1) {
                          form.setFieldValue('selectedCategories', form.values.selectedCategories.filter(c => c !== cat.id));
                          Haptics.selectionAsync();
                        }
                      } else if (form.values.selectedCategories.length < 3) {
                        // Only allow adding if under max
                        form.setFieldValue('selectedCategories', [...form.values.selectedCategories, cat.id]);
                        Haptics.selectionAsync();
                      }
                    }}
                    onLongPress={() => {
                      showAlert('Delete Category?', `Remove "${cat.name}" from your categories? This cannot be undone.`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => {
                          deleteCategory(cat.id);
                          // Remove from selected if it was selected
                          if (isSelected) {
                            form.setFieldValue('selectedCategories', form.values.selectedCategories.filter(c => c !== cat.id));
                          }
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        } },
                      ]);
                    }}
                    delayLongPress={500}
                  >
                    <View style={styles.categoryCheckmark}>
                      <MaterialIcons name={cat.icon as keyof typeof MaterialIcons.glyphMap} size={22} color={isSelected ? catColor : theme.textMuted} />
                      {isSelected && (
                        <View style={[styles.checkIcon, { backgroundColor: catColor }]}>
                          <MaterialIcons name="check" size={12} color="white" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.categoryOptionText, isSelected && { color: catColor }]}>{cat.name}</Text>
                  </Pressable>
                );
              })}
              <Pressable style={styles.newCategoryOption} onPress={() => router.push('/manage-categories')}>
                <MaterialIcons name="add" size={22} color={theme.textMuted} />
                <Text style={styles.newCategoryOptionText}>New Category</Text>
              </Pressable>
            </View>

            {/* Deities & Spiritual Beings - Multi-select (optional) */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.label}>Deities & Spiritual Beings (optional)</Text>
              {form.values.selectedDeities.length > 0 && (
                <Text style={styles.categoryCounter}>{form.values.selectedDeities.length} selected</Text>
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

            {/* Intention */}
            <Text style={styles.label}>Intention *</Text>
            <TextInput style={[styles.input, styles.textArea]} value={form.values.intention} onChangeText={form.handleChange('intention')} placeholder="What is the purpose of this ritual?" placeholderTextColor={theme.textMuted} multiline textAlignVertical="top" />
            {form.getFieldError('intention') && <Text style={styles.errorText}>{form.getFieldError('intention')}</Text>}

            {/* Tangible Outcome — optional, auto-creates manifestation entry */}
            <Text style={styles.label}>Tangible Outcome</Text>
            <TextInput style={[styles.input, styles.textArea]} value={form.values.tangibleOutcome} onChangeText={form.handleChange('tangibleOutcome')} placeholder="Optional: a specific measurable result. e.g. Receive $5,000 within 30 days" placeholderTextColor={theme.textMuted} multiline textAlignVertical="top" />
            <Text style={styles.hint}>If set, auto-adds an entry in your Cauldron (manifestation tracker)</Text>

            {/* Description */}
            <Text style={styles.label}>Steps & Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.values.description}
              onChangeText={form.handleChange('description')}
              placeholder={"Step 1: Light the candle\nStep 2: Hold the crystal...\n\nOr describe freely — whatever works for you."}
              placeholderTextColor={theme.textMuted}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.hint}>List steps line by line, or write freely</Text>

            {/* Ingredients */}
            <Text style={styles.label}>Ingredients & Tools</Text>
            <TextInput style={styles.input} value={form.values.ingredients} onChangeText={form.handleChange('ingredients')} placeholder="Comma-separated: candle, herbs, crystal..." placeholderTextColor={theme.textMuted} />
            <Text style={styles.hint}>Separate items with commas</Text>

            {/* Image Upload */}
            <ImageField
              imageUrl={form.values.imageUrl}
              onImageChange={(url) => form.setFieldValue('imageUrl', url)}
              fieldLabel="Ritual Image"
              hint="Upload a sigil, altar setup, or other ritual reference"
              uploadLabel="Add Ritual Image"
              showCameraOption={true}
              previewSize={200}
            />

            {/* Schedule */}
            <Text style={styles.label}>Schedule</Text>
            <View style={styles.scheduleGrid}>
              {scheduleOptions.map(opt => (
                <Pressable
                  key={opt.id}
                  style={[styles.scheduleOption, form.values.schedule === opt.id && styles.scheduleOptionActive]}
                  onPress={() => { form.setFieldValue('schedule', opt.id); Haptics.selectionAsync(); }}
                >
                  <MaterialIcons name={opt.icon as keyof typeof MaterialIcons.glyphMap} size={20} color={form.values.schedule === opt.id ? theme.primary : theme.textMuted} />
                  <Text style={[styles.scheduleOptionText, form.values.schedule === opt.id && styles.scheduleOptionTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Consecutive Days — all schedule types */}
            <Text style={styles.label}>Consecutive Days</Text>
            <View style={styles.consecutiveRow}>
              <Pressable
                style={styles.consecutiveBtn}
                onPress={() => { form.setFieldValue('consecutiveDays', Math.max(1, form.values.consecutiveDays - 1)); Haptics.selectionAsync(); }}
              >
                <MaterialIcons name="remove" size={20} color={theme.textPrimary} />
              </Pressable>
              <Text style={styles.consecutiveValue}>{form.values.consecutiveDays}</Text>
              <Pressable
                style={styles.consecutiveBtn}
                onPress={() => { form.setFieldValue('consecutiveDays', form.values.consecutiveDays + 1); Haptics.selectionAsync(); }}
              >
                <MaterialIcons name="add" size={20} color={theme.textPrimary} />
              </Pressable>
              <Text style={styles.consecutiveLabel}>
                {form.values.consecutiveDays === 1 ? 'day' : 'days in a row'}
              </Text>
            </View>
            {form.values.consecutiveDays > 1 && (
              <Text style={styles.hint}>
                Creates {form.values.consecutiveDays} entries starting from your chosen date
              </Text>
            )}

            {/* Moon Phase Picker */}
            {form.values.schedule === 'moon_phase' && (
              <>
                <Text style={styles.label}>Moon Phase *</Text>
                <View style={styles.moonPhaseGrid}>
                  {MOON_PHASES.map(phase => {
                    const isSelected = form.values.moonPhaseSelection === phase.index;
                    return (
                      <Pressable
                        key={phase.index}
                        style={[styles.moonPhaseOption, isSelected && styles.moonPhaseOptionActive]}
                        onPress={() => {
                          form.setFieldValue('moonPhaseSelection', phase.index);
                          form.setFieldValue('scheduledDate', getNextMoonPhaseDate(phase.index));
                          Haptics.selectionAsync();
                        }}
                      >
                        <Text style={styles.moonPhaseEmoji}>{phase.emoji}</Text>
                        <Text style={[styles.moonPhaseName, isSelected && styles.moonPhaseNameActive]}>
                          {phase.name}
                        </Text>
                        <Text style={styles.moonPhaseEnergy} numberOfLines={1}>
                          {phase.energy}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {form.values.scheduledDate && form.values.moonPhaseSelection !== null && (
                  <Text style={[styles.hint, { color: theme.primary }]}>
                    Next {MOON_PHASES[form.values.moonPhaseSelection].name}: {formatDateWithLongDay(form.values.scheduledDate)}
                  </Text>
                )}
              </>
            )}

            {/* Calendar Picker — hidden for as_needed and moon_phase */}
            {needsDate && form.values.schedule !== 'moon_phase' && (
              <>
                <Text style={styles.label}>Start Date *</Text>
                <SimpleCalendarPicker
                  selectedDate={form.values.scheduledDate || today}
                  onSelectDate={(date) => {
                    form.setFieldValue('scheduledDate', date);
                    Haptics.selectionAsync();
                  }}
                  minDate={new Date(DATE_OPTIONS[0])}
                  maxDate={new Date(DATE_OPTIONS[DATE_OPTIONS.length - 1])}
                />
                {!form.values.scheduledDate ? (
                  <Text style={styles.hint}>Select a start date from the calendar</Text>
                ) : (
                  <Text style={[styles.hint, { color: theme.primary }]}>
                    Scheduled for {formatDateWithLongDay(form.values.scheduledDate)}
                  </Text>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Library Save Prompt Modal */}
      <ConfirmationModal
        visible={showLibraryPrompt}
        title="Save to Library?"
        message="Would you like to save this ritual to your library so you can reuse it?"
        confirmLabel="Save to Library"
        cancelLabel="Not Now"
        onConfirm={handleSaveToLibrary}
        onCancel={handleSkipLibrary}
      />

      {/* Loading overlay */}
      {isSubmitting && (
        <Modal transparent={true} visible={isSubmitting} animationType="none">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: theme.radius.lg, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
              <LoadingSpinner size={52} color={theme.primary} />
              <Text style={{ marginTop: 20, fontSize: 16, fontWeight: '600', color: theme.textPrimary }}>Creating ritual...</Text>
            </View>
          </View>
        </Modal>
      )}
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
  label: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: theme.surface, borderRadius: theme.radius.md, padding: 14, fontSize: 15, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border },
  textArea: { minHeight: 100, paddingTop: 14 },
  hint: { fontSize: 12, color: theme.textMuted, marginTop: 4, marginLeft: 4, fontStyle: 'italic' },
  errorText: { fontSize: 12, color: theme.error, marginTop: 4, marginLeft: 4, fontWeight: '500' },
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
  scheduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  scheduleOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.radius.md, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border },
  scheduleOptionActive: { backgroundColor: theme.primary + '15', borderColor: theme.primary },
  scheduleOptionText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  scheduleOptionTextActive: { color: theme.primary },
  moonPhaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moonPhaseOption: {
    width: '48%', padding: 12, borderRadius: theme.radius.md,
    backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border,
    alignItems: 'center', gap: 4,
  },
  moonPhaseOptionActive: {
    backgroundColor: theme.primary + '18', borderColor: theme.primary,
  },
  moonPhaseEmoji: { fontSize: 28 },
  moonPhaseName: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, textAlign: 'center' },
  moonPhaseNameActive: { color: theme.primary },
  moonPhaseEnergy: { fontSize: 10, color: theme.textMuted, textAlign: 'center', fontStyle: 'italic' },
  consecutiveRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  consecutiveBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  consecutiveValue: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, minWidth: 32, textAlign: 'center' },
  consecutiveLabel: { fontSize: 14, color: theme.textSecondary },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryCounter: { fontSize: 12, fontWeight: '600', color: theme.textMuted },
  categoryCheckmark: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  checkIcon: { position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
