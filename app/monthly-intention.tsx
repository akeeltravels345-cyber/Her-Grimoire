import React, { useState } from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet, Platform,
  KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import StarField from '../components/StarField';
import { resolveCategoryColor } from '../utils/categoryHelpers';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const SCHEDULE_OPTIONS = [
  { id: 'as_needed', label: 'One Time', icon: 'more-time' },
  { id: 'daily',     label: 'Daily',    icon: 'today' },
  { id: 'weekly',    label: 'Weekly',   icon: 'date-range' },
  { id: 'monthly',   label: 'Monthly',  icon: 'calendar-month' },
] as const;

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

type QuickRitual = {
  tempId: string;
  name: string;
  category: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'as_needed';
  scheduledDate: Date | null;
};

type Step = 1 | 2 | 3 | 4;
const TOTAL_STEPS = 4;

export default function MonthlyIntentionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setMonthlyIntention, addRitual, categories, categoryColors } = useApp();

  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const nextMonthLabel = `${MONTH_NAMES[(now.getMonth() + 1) % 12]} ${now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()}`;

  const [step, setStep] = useState<Step>(1);

  // Step 1 — Call in
  const [callIn, setCallIn] = useState('');
  // Step 2 — Release
  const [release, setRelease] = useState('');
  // Step 3 — Anchor (rituals intention)
  const [anchor, setAnchor] = useState('');
  // Step 4 — Quick schedule
  const [queuedRituals, setQueuedRituals] = useState<QuickRitual[]>([]);
  const [addingRitual, setAddingRitual] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickCategory, setQuickCategory] = useState(categories[0]?.id || '');
  const [quickSchedule, setQuickSchedule] = useState<'daily' | 'weekly' | 'monthly' | 'as_needed'>('as_needed');
  const [quickDate, setQuickDate] = useState<Date | null>(null);

  const canGoNext: Record<Step, boolean> = {
    1: callIn.trim().length > 0,
    2: release.trim().length > 0,
    3: anchor.trim().length > 0,
    4: true, // step 4 is always skippable
  };

  const canAddQuick = quickName.trim().length > 0 && (quickSchedule === 'as_needed' || quickDate !== null);

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((step + 1) as Step);
      Haptics.selectionAsync();
    }
  };

  const goBack = () => {
    if (addingRitual) { setAddingRitual(false); resetQuickForm(); return; }
    if (step > 1) { setStep((step - 1) as Step); Haptics.selectionAsync(); }
  };

  const resetQuickForm = () => {
    setQuickName('');
    setQuickCategory(categories[0]?.id || '');
    setQuickSchedule('as_needed');
    setQuickDate(null);
  };

  const handleAddQuick = () => {
    if (!canAddQuick) return;
    setQueuedRituals(prev => [...prev, {
      tempId: Date.now().toString(),
      name: quickName.trim(),
      category: quickCategory,
      schedule: quickSchedule,
      scheduledDate: quickDate,
    }]);
    resetQuickForm();
    setAddingRitual(false);
    Haptics.selectionAsync();
  };

  const removeQueued = (tempId: string) => {
    setQueuedRituals(prev => prev.filter(r => r.tempId !== tempId));
    Haptics.selectionAsync();
  };

  const handleFinish = () => {
    // Save intention
    setMonthlyIntention(callIn.trim(), anchor.trim());

    // Schedule queued rituals
    queuedRituals.forEach(r => {
      addRitual({
        name: r.name,
        category: r.category,
        description: '',
        tangibleOutcome: '',
        schedule: r.schedule,
        scheduledDate: r.scheduledDate?.toISOString(),
        intention: callIn.trim(),
        status: 'scheduled',
      });
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  const stepTitles: Record<Step, string> = {
    1: 'Call In',
    2: 'Release',
    3: 'Anchor',
    4: 'Schedule',
  };

  const stepQuestions: Record<Step, string> = {
    1: `What do you want ${monthLabel} to bring?`,
    2: 'What are you ready to leave behind?',
    3: 'What rituals will hold your work this month?',
    4: `Schedule your first rituals for ${monthLabel}`,
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
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <StarField starCount={40} showShootingStar={false} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 32, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top row */}
            <View style={styles.topRow}>
              {(step > 1 || addingRitual) ? (
                <Pressable onPress={goBack} style={styles.backBtn} hitSlop={12}>
                  <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
                </Pressable>
              ) : <View style={{ width: 40 }} />}
              <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
                <MaterialIcons name="close" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* Progress bar */}
            <View style={styles.progressRow}>
              {([1, 2, 3, 4] as Step[]).map((s, i) => (
                <React.Fragment key={s}>
                  <View style={[styles.progressDot, step >= s && styles.progressDotActive]}>
                    {step > s ? (
                      <MaterialIcons name="check" size={8} color={theme.background} />
                    ) : null}
                  </View>
                  {i < 3 && <View style={[styles.progressBar, step > s && styles.progressBarActive]} />}
                </React.Fragment>
              ))}
            </View>
            <Text style={styles.stepLabel}>{stepTitles[step]} · Step {step} of {TOTAL_STEPS}</Text>

            {/* Month header */}
            <Text style={styles.monthTitle}>{monthLabel}</Text>
            <Text style={styles.subtitle}>A new chapter begins ✦</Text>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerStar}>✦</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── STEP 1: Call In ── */}
            {step === 1 && (
              <>
                <Text style={styles.question}>{stepQuestions[1]}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.diaryInput}
                    value={callIn}
                    onChangeText={setCallIn}
                    placeholder="Write freely — abundance, clarity, love, healing..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    textAlignVertical="top"
                    autoFocus
                  />
                </View>
                <View style={{ flex: 1 }} />
                <Pressable
                  style={[styles.nextBtn, !canGoNext[1] && styles.nextBtnDisabled]}
                  onPress={goNext}
                  disabled={!canGoNext[1]}
                >
                  <Text style={[styles.nextBtnText, !canGoNext[1] && styles.nextBtnTextDisabled]}>
                    Continue →
                  </Text>
                </Pressable>
              </>
            )}

            {/* ── STEP 2: Release ── */}
            {step === 2 && (
              <>
                <Text style={styles.question}>{stepQuestions[2]}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.diaryInput}
                    value={release}
                    onChangeText={setRelease}
                    placeholder="Fear, stagnation, a pattern, a person's energy..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    textAlignVertical="top"
                    autoFocus
                  />
                </View>
                <View style={{ flex: 1 }} />
                <Pressable
                  style={[styles.nextBtn, !canGoNext[2] && styles.nextBtnDisabled]}
                  onPress={goNext}
                  disabled={!canGoNext[2]}
                >
                  <Text style={[styles.nextBtnText, !canGoNext[2] && styles.nextBtnTextDisabled]}>
                    Continue →
                  </Text>
                </Pressable>
              </>
            )}

            {/* ── STEP 3: Anchor ── */}
            {step === 3 && (
              <>
                <Text style={styles.question}>{stepQuestions[3]}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.diaryInput}
                    value={anchor}
                    onChangeText={setAnchor}
                    placeholder="List the spells, rituals, or practices calling to you..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    textAlignVertical="top"
                    autoFocus
                  />
                </View>
                <View style={{ flex: 1 }} />
                <Pressable
                  style={[styles.nextBtn, !canGoNext[3] && styles.nextBtnDisabled]}
                  onPress={goNext}
                  disabled={!canGoNext[3]}
                >
                  <Text style={[styles.nextBtnText, !canGoNext[3] && styles.nextBtnTextDisabled]}>
                    Continue →
                  </Text>
                </Pressable>
              </>
            )}

            {/* ── STEP 4: Schedule ── */}
            {step === 4 && (
              <>
                <Text style={styles.question}>{stepQuestions[4]}</Text>

                {/* Queued rituals */}
                {queuedRituals.map(r => {
                  const catColor = resolveCategoryColor(r.category, categoryColors, categories);
                  const cat = categories.find(c => c.id === r.category);
                  return (
                    <View key={r.tempId} style={styles.queuedCard}>
                      <View style={[styles.queuedCatBar, { backgroundColor: catColor }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.queuedName}>{r.name}</Text>
                        <Text style={styles.queuedMeta}>
                          {cat?.name} · {r.schedule === 'as_needed' ? 'One Time' : r.schedule.charAt(0).toUpperCase() + r.schedule.slice(1)}
                          {r.scheduledDate ? ` · ${r.scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                        </Text>
                      </View>
                      <Pressable onPress={() => removeQueued(r.tempId)} hitSlop={10}>
                        <MaterialIcons name="close" size={18} color={theme.textMuted} />
                      </Pressable>
                    </View>
                  );
                })}

                {/* Quick-add form */}
                {addingRitual ? (
                  <View style={styles.quickAddCard}>
                    <Text style={styles.quickAddLabel}>RITUAL NAME</Text>
                    <TextInput
                      style={styles.quickAddInput}
                      value={quickName}
                      onChangeText={setQuickName}
                      placeholder="e.g., Full Moon Money Spell"
                      placeholderTextColor={theme.textMuted}
                      autoFocus
                    />

                    <Text style={styles.quickAddLabel}>CATEGORY</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {categories.map(cat => {
                          const catColor = resolveCategoryColor(cat.id, categoryColors, categories);
                          const isActive = quickCategory === cat.id;
                          return (
                            <Pressable
                              key={cat.id}
                              style={[styles.quickChip, isActive && { backgroundColor: catColor + '22', borderColor: catColor }]}
                              onPress={() => { setQuickCategory(cat.id); Haptics.selectionAsync(); }}
                            >
                              <MaterialIcons
                                name={cat.icon as keyof typeof MaterialIcons.glyphMap}
                                size={14}
                                color={isActive ? catColor : theme.textMuted}
                              />
                              <Text style={[styles.quickChipText, isActive && { color: catColor }]}>{cat.name}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </ScrollView>

                    <Text style={styles.quickAddLabel}>SCHEDULE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                      {SCHEDULE_OPTIONS.map(opt => (
                        <Pressable
                          key={opt.id}
                          style={[styles.quickChip, quickSchedule === opt.id && styles.quickChipActive]}
                          onPress={() => { setQuickSchedule(opt.id); setQuickDate(null); Haptics.selectionAsync(); }}
                        >
                          <MaterialIcons
                            name={opt.icon as keyof typeof MaterialIcons.glyphMap}
                            size={14}
                            color={quickSchedule === opt.id ? theme.primary : theme.textMuted}
                          />
                          <Text style={[styles.quickChipText, quickSchedule === opt.id && { color: theme.primary }]}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {quickSchedule !== 'as_needed' && (
                      <>
                        <Text style={styles.quickAddLabel}>START DATE</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                          <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                            {DATE_OPTIONS.map((d, i) => {
                              const isSelected = quickDate?.toDateString() === d.toDateString();
                              const isToday = d.toDateString() === new Date().toDateString();
                              return (
                                <Pressable
                                  key={i}
                                  style={[styles.datePill, isSelected && styles.datePillActive]}
                                  onPress={() => { setQuickDate(d); Haptics.selectionAsync(); }}
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
                          </View>
                        </ScrollView>
                      </>
                    )}

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Pressable
                        style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}
                        onPress={() => { setAddingRitual(false); resetQuickForm(); }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted }}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[{ flex: 2, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: theme.primary }, !canAddQuick && { backgroundColor: theme.surfaceLight }]}
                        onPress={handleAddQuick}
                        disabled={!canAddQuick}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '700', color: canAddQuick ? theme.background : theme.textMuted }}>
                          Add Ritual
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable style={styles.addRitualBtn} onPress={() => { setAddingRitual(true); Haptics.selectionAsync(); }}>
                    <MaterialIcons name="add" size={20} color={theme.primary} />
                    <Text style={styles.addRitualBtnText}>Add a ritual for {monthLabel}</Text>
                  </Pressable>
                )}

                <View style={{ flex: 1 }} />

                {queuedRituals.length > 0 && (
                  <Text style={styles.scheduledHint}>
                    ✦ {queuedRituals.length} ritual{queuedRituals.length !== 1 ? 's' : ''} ready to schedule
                  </Text>
                )}

                <Pressable style={styles.finishBtn} onPress={handleFinish}>
                  <LinearGradient
                    colors={['#C9A84C', '#B89530', '#A88520']}
                    style={styles.finishBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.finishBtnText}>
                      {queuedRituals.length > 0 ? `Begin ${monthLabel} ✦` : `Begin ${monthLabel} (no rituals) →`}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const serifFont = theme.fonts.serif;

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  progressDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(201,160,220,0.3)', alignItems: 'center', justifyContent: 'center' },
  progressDotActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  progressBar: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.10)', marginHorizontal: 4 },
  progressBarActive: { backgroundColor: theme.primary },
  stepLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 24 },

  monthTitle: { fontSize: 28, fontWeight: '700', color: '#F5D5E0', textAlign: 'center', fontFamily: serifFont, textShadowColor: 'rgba(245,213,224,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20, marginBottom: 6 },
  subtitle: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', fontStyle: 'italic', fontFamily: serifFont, marginBottom: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28, paddingHorizontal: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(201,160,220,0.25)' },
  dividerStar: { fontSize: 14, color: theme.primary },

  question: { fontSize: 20, color: '#F5D5E0', fontFamily: serifFont, fontStyle: 'italic', lineHeight: 30, textAlign: 'center', marginBottom: 24, paddingHorizontal: 8 },
  inputWrapper: { borderColor: 'rgba(201,160,220,0.2)', borderWidth: 1, borderRadius: 12, padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', minHeight: 160 },
  diaryInput: { fontSize: 16, color: '#F5D5E0', fontFamily: serifFont, lineHeight: 26, minHeight: 140, padding: 0 },

  nextBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 20 },
  nextBtnDisabled: { backgroundColor: theme.surfaceLight },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: theme.background, fontFamily: serifFont },
  nextBtnTextDisabled: { color: theme.textMuted },

  // Step 4 — queued rituals
  queuedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 12, marginBottom: 8, padding: 12, gap: 10, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  queuedCatBar: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  queuedName: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
  queuedMeta: { fontSize: 11, color: theme.textMuted, marginTop: 2 },

  addRitualBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, borderColor: theme.primary + '50', borderStyle: 'dashed', marginBottom: 12 },
  addRitualBtnText: { fontSize: 15, fontWeight: '600', color: theme.primary },

  // Quick add form
  quickAddCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  quickAddLabel: { fontSize: 10, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  quickAddInput: { backgroundColor: theme.background, borderRadius: 10, padding: 12, fontSize: 15, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border, marginBottom: 14 },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border },
  quickChipActive: { backgroundColor: theme.primary + '15', borderColor: theme.primary },
  quickChipText: { fontSize: 12, fontWeight: '600', color: theme.textMuted },

  // Date pills
  datePill: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: theme.background, borderWidth: 1.5, borderColor: theme.border, minWidth: 54 },
  datePillActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  datePillDay: { fontSize: 10, fontWeight: '600', color: theme.textMuted, marginBottom: 2 },
  datePillNum: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  datePillMonth: { fontSize: 10, color: theme.textMuted, marginTop: 2 },
  datePillTextActive: { color: theme.background },

  scheduledHint: { fontSize: 13, color: theme.primary, textAlign: 'center', fontStyle: 'italic', marginBottom: 12 },

  finishBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  finishBtnGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: 14 },
  finishBtnText: { fontSize: 16, fontWeight: '700', color: '#1C0E3A', fontFamily: serifFont, letterSpacing: 0.3 },
});
