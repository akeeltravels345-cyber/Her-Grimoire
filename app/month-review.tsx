import React, { useState, useEffect } from 'react';
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

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function MonthReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { monthlySnapshots, manifestations, saveReflection, setViewingMonthDirect } = useApp();

  // Month-review always shows the current month (the one closing)
  // Use local state to track which month we're reviewing within this screen
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [reviewingMonth, setReviewingMonth] = useState(currentMonthStr);

  // The month closing is what we're reviewing (defaults to today, can navigate back/forward)
  const snapshot = monthlySnapshots.find(s => s.month === reviewingMonth);

  // Calculate month label and next month name from reviewingMonth
  const [reviewYear, reviewMonthNum] = reviewingMonth.split('-');
  const reviewMonthIndex = parseInt(reviewMonthNum) - 1;
  const reviewMonthLabel = `${MONTH_NAMES[reviewMonthIndex]} ${reviewYear}`;

  const nextMonthIndex = (reviewMonthIndex + 1) % 12;
  const nextYear = nextMonthIndex === 0 ? parseInt(reviewYear) + 1 : parseInt(reviewYear);
  const nextMonthName = MONTH_NAMES[nextMonthIndex];

  // Manifestations logged in the reviewing month
  const monthManifested = manifestations.filter(m => {
    if (!m.results || m.results.length === 0) return false;
    return m.results.some(r => {
      const d = new Date(r.date);
      const resultMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return resultMonthStr === reviewingMonth;
    });
  });

  const [reflection, setReflection] = useState(snapshot?.reflection || '');

  // Update reflection when reviewing month changes
  useEffect(() => {
    setReflection(snapshot?.reflection || '');
  }, [reviewingMonth, snapshot?.reflection]);

  const handleClose = () => {
    // Save reflection for the reviewing month (always save if text exists, don't require snapshot to exist)
    if (reflection.trim()) {
      saveReflection(reviewingMonth, reflection.trim());
    }
    Haptics.selectionAsync();

    // Calculate next month and set it as viewingMonth for monthly-intention
    const [reviewYear, reviewMonthNum] = reviewingMonth.split('-');
    let nextMonthNum = parseInt(reviewMonthNum) + 1;
    let nextYear = parseInt(reviewYear);
    if (nextMonthNum > 12) {
      nextMonthNum = 1;
      nextYear += 1;
    }
    const nextMonthStr = `${nextYear}-${String(nextMonthNum).padStart(2, '0')}`;
    setViewingMonthDirect(nextMonthStr);

    router.push('/monthly-intention');
  };

  const completionColor = !snapshot ? theme.textMuted
    : snapshot.completionRate >= 75 ? theme.success
    : snapshot.completionRate >= 40 ? theme.warning
    : theme.error;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Gold wash — closing energy */}
      <LinearGradient
        colors={['rgba(201,168,76,0.18)', 'rgba(201,168,76,0.06)', 'transparent']}
        locations={[0, 0.4, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320, zIndex: 0 }}
        pointerEvents="none"
      />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <StarField starCount={35} showShootingStar={false} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 32 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.topRow}>
              <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* Month navigation */}
            <View style={styles.monthNav}>
              <Pressable onPress={() => {
                // Navigate backwards from the currently viewing month
                let prevMonthNum = parseInt(reviewMonthNum) - 1;
                let prevYear = parseInt(reviewYear);
                if (prevMonthNum < 1) {
                  prevMonthNum = 12;
                  prevYear -= 1;
                }
                setReviewingMonth(`${prevYear}-${String(prevMonthNum).padStart(2, '0')}`);
              }} hitSlop={12}>
                <MaterialIcons name="chevron-left" size={24} color={theme.primary} />
              </Pressable>
              <Text style={styles.monthNavLabel}>{reviewMonthLabel}</Text>
              <Pressable onPress={() => {
                // Navigate forwards from the currently viewing month
                let nextMonthNum = parseInt(reviewMonthNum) + 1;
                let nextYear = parseInt(reviewYear);
                if (nextMonthNum > 12) {
                  nextMonthNum = 1;
                  nextYear += 1;
                }
                setReviewingMonth(`${nextYear}-${String(nextMonthNum).padStart(2, '0')}`);
              }} hitSlop={12}>
                <MaterialIcons name="chevron-right" size={24} color={theme.primary} />
              </Pressable>
            </View>

            {/* Title */}
            <Text style={styles.eyebrow}>This chapter is closing</Text>
            <Text style={styles.monthTitle}>
              {reviewMonthLabel}
            </Text>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
            </View>

            {/* Stats row */}
            {snapshot ? (
              <>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.success }]}>{snapshot.totalCompleted}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: snapshot.totalMissed > 0 ? theme.error : theme.textMuted }]}>
                      {snapshot.totalMissed}
                    </Text>
                    <Text style={styles.statLabel}>Missed</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: completionColor }]}>{snapshot.completionRate}%</Text>
                    <Text style={styles.statLabel}>Done</Text>
                  </View>
                  {monthManifested.length > 0 && (
                    <>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#4EA8DE' }]}>{monthManifested.length}</Text>
                        <Text style={styles.statLabel}>Manifested</Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Completion bar */}
                <View style={styles.completionBarBg}>
                  <View style={[styles.completionBarFill, { width: `${snapshot.completionRate}%` as any, backgroundColor: completionColor }]} />
                </View>

                {/* Intention recap */}
                {snapshot.intentionSet && snapshot.intention ? (
                  <View style={styles.intentionRecap}>
                    <Text style={styles.intentionRecapLabel}>Your intention was</Text>
                    <Text style={styles.intentionRecapText}>"{snapshot.intention}"</Text>
                  </View>
                ) : null}

                {/* Core categories */}
                {snapshot.coreCategoryResults.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Core Practice</Text>
                    {snapshot.coreCategoryResults.map(cat => (
                      <View key={cat.categoryId} style={styles.catRow}>
                        <MaterialIcons
                          name={cat.completed ? 'check-circle' : 'radio-button-unchecked'}
                          size={18}
                          color={cat.completed ? theme.success : theme.textMuted}
                        />
                        <Text style={[styles.catName, cat.completed && { color: theme.success }]}>
                          {cat.categoryName}
                        </Text>
                        <Text style={styles.catCount}>
                          {cat.ritualsCompleted}/{cat.ritualsScheduled}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Missed rituals */}
                {snapshot.missedRituals.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Left Uncast</Text>
                    {snapshot.missedRituals.slice(0, 5).map(r => (
                      <Text key={r.id} style={styles.missedItem}>· {r.name}</Text>
                    ))}
                    {snapshot.missedRituals.length > 5 && (
                      <Text style={styles.missedMore}>+ {snapshot.missedRituals.length - 5} more</Text>
                    )}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noSnapshotCard}>
                <Text style={styles.noSnapshotText}>No data recorded for last month yet.</Text>
              </View>
            )}

            {/* Reflection prompt */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What actually shifted?</Text>
              <Text style={styles.reflectionHint}>
                Results, signs, feelings, unexpected turns — write freely.
              </Text>
              <View style={styles.reflectionInputWrapper}>
                <TextInput
                  style={styles.reflectionInput}
                  value={reflection}
                  onChangeText={setReflection}
                  placeholder="What came through this month..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* CTA */}
            <Pressable style={styles.nextMonthBtn} onPress={handleClose}>
              <LinearGradient
                colors={[theme.primary + 'DD', theme.primaryDark + 'DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextMonthBtnGradient}
              >
                <Text style={styles.nextMonthBtnText}>Step into {nextMonthName}</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => {
                if (snapshot && reflection.trim()) saveReflection(snapshot.month, reflection.trim());
                router.back();
              }}
              style={styles.skipLink}
            >
              <Text style={styles.skipLinkText}>Skip for now</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const serifFont = theme.fonts.serif;

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8, marginBottom: 16 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 },
  monthNavLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, textAlign: 'center', minWidth: 120 },

  eyebrow: { fontSize: 12, fontWeight: '700', color: '#C9A84C', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  monthTitle: { fontSize: 32, fontWeight: '700', color: '#F5D5E0', textAlign: 'center', fontFamily: serifFont, textShadowColor: 'rgba(201,168,76,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20, marginBottom: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, paddingHorizontal: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.25)' },
  dividerGlyph: { fontSize: 14, color: '#C9A84C' },

  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: theme.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '700' },
  statLabel: { fontSize: 10, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', marginTop: 2, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 30, backgroundColor: theme.border },

  completionBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 20 },
  completionBarFill: { height: 6, borderRadius: 3 },

  intentionRecap: { backgroundColor: 'rgba(201,168,76,0.08)', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  intentionRecapLabel: { fontSize: 10, fontWeight: '700', color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  intentionRecapText: { fontSize: 15, color: '#F5D5E0', fontFamily: serifFont, fontStyle: 'italic', lineHeight: 22 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },

  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
  catName: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.textPrimary },
  catCount: { fontSize: 12, fontWeight: '600', color: theme.textMuted },

  missedItem: { fontSize: 13, color: theme.textMuted, paddingVertical: 4, fontStyle: 'italic' },
  missedMore: { fontSize: 12, color: theme.textMuted, marginTop: 4 },

  noSnapshotCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: theme.border },
  noSnapshotText: { fontSize: 14, color: theme.textMuted, textAlign: 'center' },

  reflectionHint: { fontSize: 12, color: theme.textMuted, fontStyle: 'italic', marginBottom: 10 },
  reflectionInputWrapper: { borderColor: 'rgba(201,160,220,0.2)', borderWidth: 1, borderRadius: 12, padding: 14, backgroundColor: 'rgba(255,255,255,0.03)', minHeight: 120 },
  reflectionInput: { fontSize: 15, color: '#F5D5E0', fontFamily: serifFont, lineHeight: 24, minHeight: 100, padding: 0 },

  nextMonthBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8, marginBottom: 12 },
  nextMonthBtnGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: 14 },
  nextMonthBtnText: { fontSize: 16, fontWeight: '700', color: '#F5D5E0', fontFamily: serifFont, letterSpacing: 0.3 },

  skipLink: { alignItems: 'center', paddingVertical: 12 },
  skipLinkText: { fontSize: 13, color: theme.textMuted, fontWeight: '600' },
});
