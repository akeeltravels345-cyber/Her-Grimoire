import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, getCurrentMoonPhase } from '../constants/theme';
import { getTodayPlanet } from '../constants/planetaryData';
import { getCurrentPlanetaryHour } from '../services/planetaryHours';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { useAlert } from '@/template';
import StarField from '../components/StarField';
import { LoadingSpinner } from '../components/LoadingSpinner';
import ImageField from '../components/ImageField';
import { useForm } from '../hooks/useForm';
import { validateJournalForm } from '../utils/validationHelpers';
import { formatFullDateWithDay, formatDateWithShortDay, formatDateWithDayAndYear } from '../utils/dateHelpers';
import SimpleDatePicker from '../components/SimpleDatePicker';

export default function LogRitualScreen() {
  const { ritualId, mode, returnTo } = useLocalSearchParams<{ ritualId: string; mode?: string; returnTo?: string }>();
  const isReflectMode = mode === 'reflect';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { rituals, addJournalEntry, moods, addMood, deleteMood } = useApp();
  const { showAlert } = useAlert();
  const { showToast } = useToast();
  const ritual = rituals.find(r => r.id === ritualId);


  const todayDateString = useMemo(() => new Date().toDateString(), []);

  // Form state management
  const form = useForm({
    initialValues: {
      notes: '',
      completedDate: new Date(),
      selectedMoods: [] as string[],
      imageUrl: undefined as string | undefined,
    },
    validate: (values) => {
      const errors = validateJournalForm({
        reflection: values.notes,
        moods: values.selectedMoods,
      });
      return errors.map(e => ({
        ...e,
        field: e.field === 'moods' ? 'selectedMoods' : e.field
      }));
    },
    onSubmit: async (values) => {
      // Will be overridden by handleSaveEntry
      await new Promise(resolve => setTimeout(resolve, 100));
    },
  });

  const [showCompletedDatePicker, setShowCompletedDatePicker] = useState(false);
  const [isAddingMood, setIsAddingMood] = useState(false);
  const [newMoodText, setNewMoodText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const moonPhase = getCurrentMoonPhase();
  const todayPlanet = getTodayPlanet();
  const currentHour = getCurrentPlanetaryHour();

  const canSave = form.values.selectedMoods.length > 0 && !form.isSubmitting;

  const handleSaveEntry = async () => {
    // Validate form before attempting to save
    if (form.hasErrors()) {
      const firstError = form.errors[0];
      showToast(firstError.message, 'error', { duration: 4000 });
      return;
    }

    if (!form.values.selectedMoods.length) {
      showToast('Please select at least one mood that describes how you felt', 'error', { duration: 4000 });
      return;
    }

    if (!ritualId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const cosmicParts: string[] = [
        `${moonPhase.icon} ${moonPhase.name} · ${moonPhase.energy}`,
        `${todayPlanet.emoji} Day of ${todayPlanet.name}`,
      ];
      if (currentHour) cosmicParts.push(`${currentHour.planet.emoji} Hour of ${currentHour.planet.name}`);

      addJournalEntry(
        ritualId,
        { date: form.values.completedDate.toISOString(), notes: form.values.notes.trim(), moods: form.values.selectedMoods, cosmicContext: cosmicParts.join(' · '), imageUrl: form.values.imageUrl },
        { markComplete: !isReflectMode }
      );

      const successMessage = isReflectMode ? 'Reflection saved!' : `"${ritual.name}" logged!`;
      showToast(successMessage, 'success');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate based on where user came from
      if (returnTo) {
        router.replace(returnTo);
      } else {
        router.back();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save. Please try again.';
      showToast(errorMessage, 'error', { duration: 4000 });
      console.error('[handleSaveEntry] Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ritual) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <SafeAreaView edges={['top']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.textSecondary, fontSize: 16 }}>Ritual not found</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>Go back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <LinearGradient
        colors={[theme.primary + '20', theme.primary + '08', 'transparent']}
        locations={[0, 0.4, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
        pointerEvents="none"
      />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <StarField starCount={40} showShootingStar={false} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{isReflectMode ? 'Add Reflection' : 'Log Ritual'}</Text>
        <Pressable onPress={handleSaveEntry} style={[styles.saveBtn, (!canSave || form.isSubmitting) && styles.saveBtnDisabled]} disabled={!canSave || form.isSubmitting}>
          <Text style={[styles.saveBtnText, (!canSave || form.isSubmitting) && styles.saveBtnTextDisabled]}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.ritualInfo}>
            <Image source={require('../assets/images/ritual-complete.png')} style={styles.ritualImage} contentFit="contain" />
            <Text style={styles.ritualName}>{ritual.name}</Text>
            <Text style={styles.ritualDate}>
              {formatFullDateWithDay(form.values.completedDate)}
            </Text>
          </View>

          {/* Date */}
          <Text style={styles.label}>{isReflectMode ? 'Date' : 'Date Completed'}</Text>
          <Pressable style={styles.completedDateField} onPress={() => setShowCompletedDatePicker(true)}>
            <MaterialIcons name="event-available" size={20} color={theme.primary} />
            <Text style={styles.completedDateText}>
              {formatDateWithDayAndYear(form.values.completedDate)}
            </Text>
            <MaterialIcons name="edit-calendar" size={18} color={theme.textMuted} />
          </Pressable>
          <Text style={styles.completedDateHint}>{isReflectMode ? 'Defaults to today — change if reflecting on a past moment' : 'Defaults to today — change if you are logging a past practice'}</Text>

          {/* Cosmic Context Card */}
          <View style={styles.cosmicCard}>
            <View style={styles.cosmicRow}>
              <Text style={styles.cosmicEmoji}>{moonPhase.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cosmicLabel}>{moonPhase.name}</Text>
                <Text style={styles.cosmicSub}>{moonPhase.energy}</Text>
              </View>
            </View>
            <View style={styles.cosmicDivider} />
            <View style={styles.cosmicRow}>
              <Text style={styles.cosmicEmoji}>{todayPlanet.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cosmicLabel}>Day of {todayPlanet.name}</Text>
                <Text style={styles.cosmicSub}>{todayPlanet.bestWorkings[0]}</Text>
              </View>
            </View>
            {currentHour ? (
              <>
                <View style={styles.cosmicDivider} />
                <View style={styles.cosmicRow}>
                  <Text style={styles.cosmicEmoji}>{currentHour.planet.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cosmicLabel}>Hour of {currentHour.planet.name}</Text>
                    <Text style={styles.cosmicSub}>{currentHour.planet.bestWorkings[0]}</Text>
                  </View>
                </View>
              </>
            ) : null}
          </View>

          {/* How do you feel? - Multi-select */}
          <Text style={styles.label}>How do you feel? * (select one or more)</Text>
          {form.getFieldError('moods') && <Text style={styles.errorText}>{form.getFieldError('moods')}</Text>}
          <View style={styles.moodGrid}>
            {moods.map(m => {
              const isSelected = form.values.selectedMoods.includes(m);
              return (
                <Pressable
                  key={m}
                  style={[styles.moodChip, isSelected && styles.moodChipActive]}
                  onPress={() => {
                    if (isSelected) {
                      // Don't allow deselecting if it's the only one
                      if (form.values.selectedMoods.length > 1) {
                        form.setFieldValue('selectedMoods', form.values.selectedMoods.filter(mood => mood !== m));
                        Haptics.selectionAsync();
                      }
                    } else {
                      // Allow adding multiple moods (no maximum)
                      form.setFieldValue('selectedMoods', [...form.values.selectedMoods, m]);
                      Haptics.selectionAsync();
                    }
                  }}
                  onLongPress={() => {
                    showAlert('Delete Mood?', `Remove "${m}" from your mood options?`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          deleteMood(m);
                          if (isSelected) {
                            form.setFieldValue('selectedMoods', form.values.selectedMoods.filter(mood => mood !== m));
                          }
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        }
                      }
                    ]);
                  }}
                  delayLongPress={500}
                >
                  <View style={styles.moodCheckmark}>
                    <Text style={[styles.moodChipText, isSelected && styles.moodChipTextActive]}>{m}</Text>
                    {isSelected && (
                      <MaterialIcons name="check" size={14} color={theme.primary} />
                    )}
                  </View>
                </Pressable>
              );
            })}
            {isAddingMood ? (
              <View style={styles.moodAddInline}>
                <TextInput style={styles.moodAddInput} value={newMoodText} onChangeText={setNewMoodText} placeholder="New mood..." placeholderTextColor={theme.textMuted} autoFocus onSubmitEditing={() => { if (newMoodText.trim()) { addMood(newMoodText.trim()); setNewMoodText(''); } setIsAddingMood(false); }} returnKeyType="done" />
                <Pressable onPress={() => { if (newMoodText.trim()) { addMood(newMoodText.trim()); setNewMoodText(''); } setIsAddingMood(false); }} hitSlop={8}><MaterialIcons name="check" size={18} color={theme.success} /></Pressable>
                <Pressable onPress={() => { setIsAddingMood(false); setNewMoodText(''); }} hitSlop={8}><MaterialIcons name="close" size={18} color={theme.textMuted} /></Pressable>
              </View>
            ) : (
              <Pressable style={styles.moodAddChip} onPress={() => { setIsAddingMood(true); Haptics.selectionAsync(); }}>
                <MaterialIcons name="add" size={14} color={theme.accent} />
                <Text style={styles.moodAddChipText}>Add</Text>
              </Pressable>
            )}
          </View>

          {/* Notes */}
          <Text style={styles.label}>Notes</Text>
          <TextInput style={[styles.input, styles.textArea]} value={form.values.notes} onChangeText={form.handleChange('notes')} placeholder="Describe your experience... What happened? What did you notice? How did the energy feel?" placeholderTextColor={theme.textMuted} multiline textAlignVertical="top" />

          {/* Image Upload */}
          <ImageField
            imageUrl={form.values.imageUrl}
            onImageChange={(url) => form.setFieldValue('imageUrl', url)}
            fieldLabel="Ritual Photo"
            hint="Document your ritual setup or results"
            uploadLabel="Add Ritual Photo"
            showCameraOption={true}
            previewSize={200}
          />
        </ScrollView>

      </KeyboardAvoidingView>

      {/* Loading overlay */}
      {isSubmitting && (
        <Modal transparent={true} visible={isSubmitting} animationType="none">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: theme.radius.lg, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
              <LoadingSpinner size={52} color={theme.primary} />
              <Text style={{ marginTop: 20, fontSize: 16, fontWeight: '600', color: theme.textPrimary }}>Logging ritual...</Text>
            </View>
          </View>
        </Modal>
      )}
      </SafeAreaView>

      {/* Date Picker Modal */}
      <Modal transparent visible={showCompletedDatePicker} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, paddingTop: 20, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary }}>Select Date</Text>
              <Pressable onPress={() => setShowCompletedDatePicker(false)}>
                <MaterialIcons name="close" size={24} color={theme.textPrimary} />
              </Pressable>
            </View>
            <SimpleDatePicker
              selectedDate={form.values.completedDate}
              onSelectDate={(date) => {
                form.setFieldValue('completedDate', date);
                setShowCompletedDatePicker(false);
              }}
            />
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
  ritualInfo: { alignItems: 'center', paddingTop: 24, paddingBottom: 8 },
  ritualImage: { width: 80, height: 80, marginBottom: 16 },
  ritualName: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', marginBottom: 4 },
  ritualDate: { fontSize: 14, color: theme.textSecondary },
  completedDateField: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.surface, borderRadius: theme.radius.md,
    padding: 14, borderWidth: 1, borderColor: theme.primary + '30',
  },
  completedDateText: { flex: 1, fontSize: 15, color: theme.textPrimary, fontWeight: '600' },
  completedDateHint: { fontSize: 12, color: theme.textSecondary, marginTop: 6, marginLeft: 4, fontStyle: 'italic' },

  // Cosmic Context
  cosmicCard: { backgroundColor: theme.surface, borderRadius: theme.radius.md, padding: 14, marginTop: 16, borderWidth: 1, borderColor: theme.primary + '20', ...theme.shadows.card },
  cosmicRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  cosmicEmoji: { fontSize: 20 },
  cosmicLabel: { fontSize: 13, fontWeight: '600', color: theme.textPrimary },
  cosmicSub: { fontSize: 11, color: theme.textSecondary },
  cosmicDivider: { height: 1, backgroundColor: theme.border + '60', marginVertical: 6 },

  label: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, marginTop: 24, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  errorText: { fontSize: 12, color: theme.error, marginTop: -6, marginBottom: 8, marginLeft: 4, fontWeight: '500' },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border },
  moodChipActive: { backgroundColor: theme.primary + '20', borderColor: theme.primary },
  moodChipText: { fontSize: 13, fontWeight: '500', color: theme.textMuted },
  moodChipTextActive: { color: theme.primary, fontWeight: '600' },
  moodAddChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: theme.accent + '40', borderStyle: 'dashed', backgroundColor: theme.accent + '08' },
  moodAddChipText: { fontSize: 13, fontWeight: '600', color: theme.accent },
  moodAddInline: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.primary + '40' },
  moodAddInput: { fontSize: 13, color: theme.textPrimary, minWidth: 80, padding: 0 },

  input: { backgroundColor: theme.surface, borderRadius: theme.radius.md, padding: 14, fontSize: 15, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border },
  textArea: { minHeight: 120, paddingTop: 14, lineHeight: 22 },

  hint: { fontSize: 12, color: theme.textMuted, marginTop: 4, marginLeft: 4, fontStyle: 'italic', marginBottom: 8 },
  moodCheckmark: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
