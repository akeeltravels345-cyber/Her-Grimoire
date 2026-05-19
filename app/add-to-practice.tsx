import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { resolveCategoryColor, resolveCategory } from '../utils/categoryHelpers';
import { useAlert } from '@/template';
import GradientScreen from '../components/GradientScreen';

const scheduleOptions = [
  { id: 'daily',      label: 'Daily',      icon: 'today' },
  { id: 'weekly',     label: 'Weekly',     icon: 'date-range' },
  { id: 'monthly',    label: 'Monthly',    icon: 'calendar-month' },
  { id: 'moon_phase', label: 'Moon Phase', icon: 'nightlight-round' },
  { id: 'as_needed',  label: 'One Time',   icon: 'more-time' },
] as const;

const MOON_PHASES = [
  { index: 0, name: 'New Moon',        emoji: '🌑', energy: 'Intentions & new beginnings' },
  { index: 1, name: 'Waxing Crescent', emoji: '🌒', energy: 'Building momentum' },
  { index: 2, name: 'First Quarter',   emoji: '🌓', energy: 'Taking action' },
  { index: 3, name: 'Waxing Gibbous',  emoji: '🌔', energy: 'Refinement & growth' },
  { index: 4, name: 'Full Moon',       emoji: '🌕', energy: 'Manifestation & release' },
  { index: 5, name: 'Waning Gibbous',  emoji: '🌖', energy: 'Gratitude & sharing' },
  { index: 6, name: 'Last Quarter',    emoji: '🌗', energy: 'Releasing & letting go' },
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
  for (let i = 0; i < 60; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
})();

export default function AddToPracticeScreen() {
  const { libraryId } = useLocalSearchParams<{ libraryId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { libraryRituals, addToPractice, categoryColors, categories } = useApp();
  const { showAlert } = useAlert();

  const libRitual = libraryRituals.find(r => r.id === libraryId);

  const [schedule, setSchedule] = useState<'daily' | 'weekly' | 'monthly' | 'moon_phase' | 'as_needed'>(
    libRitual?.schedule || 'as_needed'
  );
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [consecutiveDays, setConsecutiveDays] = useState(1);
  const [moonPhaseSelection, setMoonPhaseSelection] = useState<number | null>(
    libRitual?.schedule === 'moon_phase' && libRitual?.scheduleDetail != null
      ? parseInt(libRitual.scheduleDetail)
      : null
  );
  const [tangibleOutcome, setTangibleOutcome] = useState(libRitual?.tangibleOutcome || '');

  const isMoonPhase = schedule === 'moon_phase';
  const canSave =
    scheduledDate !== null &&
    (!isMoonPhase || moonPhaseSelection !== null);

  const handleSave = () => {
    if (!canSave || !libraryId) return;
    addToPractice(libraryId, {
      scheduledDate: scheduledDate!.toISOString(),
      schedule,
      scheduleDetail: isMoonPhase && moonPhaseSelection !== null ? String(moonPhaseSelection) : undefined,
      consecutiveDays: consecutiveDays > 1 ? consecutiveDays : undefined,
      tangibleOutcome: tangibleOutcome.trim(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert('Added to Practice!', `${libRitual?.name || 'Ritual'} has been scheduled.`);
    router.back();
  };

  if (!libRitual) {
    return (
      <GradientScreen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.textSecondary, fontSize: 16 }}>Ritual not found</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>Go back</Text>
          </Pressable>
        </View>
      </GradientScreen>
    );
  }

  const catObj = resolveCategory(libRitual.category, categories);
  const catColor = resolveCategoryColor(libRitual.category, categoryColors, categories);

  return (
    <GradientScreen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Add to Practice</Text>
        <Pressable onPress={handleSave} style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} disabled={!canSave}>
          <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>Schedule</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Ritual info */}
          <View style={styles.ritualCard}>
            <View style={styles.ritualCardHeader}>
              <MaterialIcons
                name={(catObj?.icon || 'auto-awesome') as keyof typeof MaterialIcons.glyphMap}
                size={26}
                color={catColor}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.ritualName}>{libRitual.name}</Text>
                {catObj && (
                  <View style={[styles.categoryBadge, { backgroundColor: catColor + '20' }]}>
                    <Text style={[styles.categoryBadgeText, { color: catColor }]}>{catObj.name}</Text>
                  </View>
                )}
              </View>
            </View>
            {libRitual.intention ? (
              <Text style={styles.ritualIntention} numberOfLines={2}>"{libRitual.intention}"</Text>
            ) : null}
          </View>

          {/* Tangible Outcome */}
          <Text style={styles.label}>What does success look like?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={tangibleOutcome}
            onChangeText={setTangibleOutcome}
            placeholder="e.g., Receive $5,000 within 30 days, land a new client this month..."
            placeholderTextColor={theme.textMuted}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.hint}>Be specific — this becomes your manifestation to track</Text>

          {/* Schedule */}
          <Text style={styles.label}>Schedule</Text>
          <View style={styles.scheduleGrid}>
            {scheduleOptions.map(opt => (
              <Pressable
                key={opt.id}
                style={[styles.scheduleOption, schedule === opt.id && styles.scheduleOptionActive]}
                onPress={() => {
                  setSchedule(opt.id);
                  setScheduledDate(null);
                  setMoonPhaseSelection(null);
                  Haptics.selectionAsync();
                }}
              >
                <MaterialIcons
                  name={opt.icon as keyof typeof MaterialIcons.glyphMap}
                  size={18}
                  color={schedule === opt.id ? theme.primary : theme.textMuted}
                />
                <Text style={[styles.scheduleOptionText, schedule === opt.id && styles.scheduleOptionTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Consecutive Days — all schedule types */}
          <Text style={styles.label}>Consecutive Days</Text>
          <View style={styles.consecutiveRow}>
            <Pressable
              style={styles.consecutiveBtn}
              onPress={() => { setConsecutiveDays(d => Math.max(1, d - 1)); Haptics.selectionAsync(); }}
            >
              <MaterialIcons name="remove" size={20} color={theme.textPrimary} />
            </Pressable>
            <Text style={styles.consecutiveValue}>{consecutiveDays}</Text>
            <Pressable
              style={styles.consecutiveBtn}
              onPress={() => { setConsecutiveDays(d => d + 1); Haptics.selectionAsync(); }}
            >
              <MaterialIcons name="add" size={20} color={theme.textPrimary} />
            </Pressable>
            <Text style={styles.consecutiveLabel}>
              {consecutiveDays === 1 ? 'day' : 'days in a row'}
            </Text>
          </View>
          {consecutiveDays > 1 && (
            <Text style={styles.hint}>
              ✦ Creates {consecutiveDays} entries starting from your chosen date
            </Text>
          )}

          {/* Moon Phase Picker */}
          {isMoonPhase && (
            <>
              <Text style={styles.label}>Moon Phase *</Text>
              <View style={styles.moonPhaseGrid}>
                {MOON_PHASES.map(phase => {
                  const isSelected = moonPhaseSelection === phase.index;
                  return (
                    <Pressable
                      key={phase.index}
                      style={[styles.moonPhaseOption, isSelected && styles.moonPhaseOptionActive]}
                      onPress={() => {
                        setMoonPhaseSelection(phase.index);
                        setScheduledDate(getNextMoonPhaseDate(phase.index));
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
              {scheduledDate && moonPhaseSelection !== null && (
                <Text style={[styles.hint, { color: theme.primary }]}>
                  ✦ Next {MOON_PHASES[moonPhaseSelection].name}: {scheduledDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
              )}
            </>
          )}

          {/* Date strip — hidden for moon_phase */}
          {!isMoonPhase && (
            <>
              <Text style={styles.label}>Start Date *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateStrip}
              >
                {DATE_OPTIONS.map((d, i) => {
                  const isSelected = scheduledDate?.toDateString() === d.toDateString();
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <Pressable
                      key={i}
                      style={[styles.datePill, isSelected && styles.datePillActive]}
                      onPress={() => { setScheduledDate(d); Haptics.selectionAsync(); }}
                    >
                      <Text style={[styles.datePillDay, isSelected && styles.datePillTextActive]}>
                        {isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                      <Text style={[styles.datePillNum, isSelected && styles.datePillTextActive]}>
                        {d.getDate()}
                      </Text>
                      <Text style={[styles.datePillMonth, isSelected && styles.datePillTextActive]}>
                        {d.toLocaleDateString('en-US', { month: 'short' })}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {!scheduledDate ? (
                <Text style={styles.hint}>Swipe to pick a start date</Text>
              ) : (
                <Text style={[styles.hint, { color: theme.primary }]}>
                  Scheduled for {scheduledDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientScreen>
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

  ritualCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 1, borderColor: theme.primary + '20' },
  ritualCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ritualName: { fontSize: 17, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  categoryBadgeText: { fontSize: 11, fontWeight: '600' },
  ritualIntention: { fontSize: 13, color: theme.textSecondary, marginTop: 10, lineHeight: 18, fontStyle: 'italic' },

  label: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginTop: 24, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: theme.surface, borderRadius: theme.radius.md, padding: 14, fontSize: 15, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border },
  textArea: { minHeight: 90, paddingTop: 14, lineHeight: 22 },
  hint: { fontSize: 12, color: theme.textMuted, marginTop: 6, fontStyle: 'italic' },

  scheduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scheduleOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border },
  scheduleOptionActive: { backgroundColor: theme.primary + '15', borderColor: theme.primary },
  scheduleOptionText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  scheduleOptionTextActive: { color: theme.primary },

  consecutiveRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  consecutiveBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  consecutiveValue: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, minWidth: 32, textAlign: 'center' },
  consecutiveLabel: { fontSize: 14, color: theme.textSecondary },

  moonPhaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moonPhaseOption: { width: '48%', padding: 12, borderRadius: theme.radius.md, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border, alignItems: 'center', gap: 4 },
  moonPhaseOptionActive: { backgroundColor: theme.primary + '18', borderColor: theme.primary },
  moonPhaseEmoji: { fontSize: 28 },
  moonPhaseName: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, textAlign: 'center' },
  moonPhaseNameActive: { color: theme.primary },
  moonPhaseEnergy: { fontSize: 10, color: theme.textMuted, textAlign: 'center', fontStyle: 'italic' },

  dateStrip: { paddingVertical: 4, paddingRight: 16, gap: 8 },
  datePill: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border, minWidth: 58 },
  datePillActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  datePillDay: { fontSize: 11, fontWeight: '600', color: theme.textMuted, marginBottom: 2 },
  datePillNum: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
  datePillMonth: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  datePillTextActive: { color: theme.background },
});
