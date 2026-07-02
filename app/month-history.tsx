import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, LayoutAnimation,
  Platform, UIManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { MonthlySnapshot } from '../contexts/AppContext';
import StarField from '../components/StarField';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function completionColor(rate: number): string {
  if (rate >= 75) return theme.success;
  if (rate >= 40) return theme.warning;
  return theme.error;
}

function completionLabel(rate: number): string {
  if (rate >= 90) return 'Exceptional';
  if (rate >= 75) return 'Strong';
  if (rate >= 50) return 'Growing';
  if (rate >= 25) return 'Sparse';
  return 'Fallow';
}

function SnapshotCard({ snap, defaultExpanded = false }: { snap: MonthlySnapshot; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const color = completionColor(snap.completionRate);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.selectionAsync();
    setExpanded(e => !e);
  };

  return (
    <View style={styles.card}>
      {/* Colored left bar */}
      <View style={[styles.cardAccentBar, { backgroundColor: color }]} />

      <View style={styles.cardInner}>
        {/* Header row — always visible */}
        <Pressable onPress={toggle} style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardMonthLabel}>{snap.label}</Text>
            <Text style={[styles.cardStatusLabel, { color }]}>
              {completionLabel(snap.completionRate)}
            </Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={[styles.cardRate, { color }]}>{snap.completionRate}%</Text>
            <MaterialIcons
              name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={20}
              color={theme.textMuted}
            />
          </View>
        </Pressable>

        {/* Completion bar */}
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${snap.completionRate}%` as any, backgroundColor: color }]} />
        </View>

        {/* Quick stats row */}
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text style={[styles.quickStatVal, { color: theme.success }]}>{snap.totalCompleted}</Text>
            <Text style={styles.quickStatLbl}>Done</Text>
          </View>
          <View style={styles.quickStatDiv} />
          <View style={styles.quickStat}>
            <Text style={[styles.quickStatVal, { color: snap.totalMissed > 0 ? theme.error : theme.textMuted }]}>
              {snap.totalMissed}
            </Text>
            <Text style={styles.quickStatLbl}>Missed</Text>
          </View>
          <View style={styles.quickStatDiv} />
          <View style={styles.quickStat}>
            <Text style={[styles.quickStatVal, { color: theme.textSecondary }]}>{snap.totalScheduled}</Text>
            <Text style={styles.quickStatLbl}>Scheduled</Text>
          </View>
          {snap.monthlyStreakCount > 0 && (
            <>
              <View style={styles.quickStatDiv} />
              <View style={styles.quickStat}>
                <Text style={[styles.quickStatVal, { color: '#C9A84C' }]}>{snap.monthlyStreakCount}</Text>
                <Text style={styles.quickStatLbl}>Streak</Text>
              </View>
            </>
          )}
        </View>

        {/* Expanded detail */}
        {expanded && (
          <View style={styles.expandedSection}>
            {/* Intention */}
            {snap.intentionSet && snap.intention ? (
              <View style={styles.intentionBox}>
                <Text style={styles.intentionBoxLabel}>Intention</Text>
                <Text style={styles.intentionBoxText}>"{snap.intention}"</Text>
              </View>
            ) : null}

            {/* Release */}
            {snap.release ? (
              <View style={[styles.intentionBox, { borderColor: 'rgba(184,176,232,0.18)', backgroundColor: 'rgba(184,176,232,0.07)' }]}>
                <Text style={[styles.intentionBoxLabel, { color: theme.accent }]}>Released</Text>
                <Text style={styles.intentionBoxText}>"{snap.release}"</Text>
              </View>
            ) : null}

            {/* Reflection */}
            {snap.reflection ? (
              <View style={[styles.intentionBox, { borderColor: 'rgba(126,212,168,0.18)', backgroundColor: 'rgba(126,212,168,0.07)' }]}>
                <Text style={[styles.intentionBoxLabel, { color: theme.success }]}>What shifted</Text>
                <Text style={styles.intentionBoxText}>{snap.reflection}</Text>
              </View>
            ) : null}

            {/* Core categories */}
            {snap.coreCategoryResults.length > 0 && (
              <View style={styles.expandedBlock}>
                <Text style={styles.expandedBlockTitle}>Core Practice</Text>
                {snap.coreCategoryResults.map(cat => (
                  <View key={cat.categoryId} style={styles.catRow}>
                    <MaterialIcons
                      name={cat.completed ? 'check-circle' : 'radio-button-unchecked'}
                      size={16}
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
            {snap.missedRituals.length > 0 && (
              <View style={styles.expandedBlock}>
                <Text style={styles.expandedBlockTitle}>Left Uncast</Text>
                {snap.missedRituals.slice(0, 4).map(r => (
                  <Text key={r.id} style={styles.missedItem}>· {r.name}</Text>
                ))}
                {snap.missedRituals.length > 4 && (
                  <Text style={styles.missedMore}>+ {snap.missedRituals.length - 4} more</Text>
                )}
              </View>
            )}

            {/* Completed rituals */}
            {snap.completedRituals.length > 0 && (
              <View style={styles.expandedBlock}>
                <Text style={styles.expandedBlockTitle}>Completed</Text>
                {snap.completedRituals.slice(0, 4).map(r => (
                  <Text key={r.id} style={styles.completedItem}>✓ {r.name}</Text>
                ))}
                {snap.completedRituals.length > 4 && (
                  <Text style={styles.missedMore}>+ {snap.completedRituals.length - 4} more</Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

export default function MonthHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { monthlySnapshots } = useApp();

  // Sort descending (most recent first)
  const sorted = [...monthlySnapshots].sort((a, b) => b.month.localeCompare(a.month));

  const totalMonths = sorted.length;
  const strongMonths = sorted.filter(s => s.completionRate >= 75).length;
  const avgRate = totalMonths > 0
    ? Math.round(sorted.reduce((sum, s) => sum + s.completionRate, 0) / totalMonths)
    : 0;
  const longestStreak = sorted.length > 0 ? Math.max(...sorted.map(s => s.monthlyStreakCount)) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Gold gradient wash */}
      <LinearGradient
        colors={['rgba(201,168,76,0.12)', 'rgba(201,168,76,0.04)', 'transparent']}
        locations={[0, 0.35, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 260, zIndex: 0 }}
        pointerEvents="none"
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <StarField starCount={25} showShootingStar={false} />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
            <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Monthly Chronicle</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary header */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: '#C9A84C' }]}>{totalMonths}</Text>
              <Text style={styles.summaryLbl}>Months</Text>
            </View>
            <View style={styles.summaryDiv} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: theme.success }]}>{strongMonths}</Text>
              <Text style={styles.summaryLbl}>Strong</Text>
            </View>
            <View style={styles.summaryDiv} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: completionColor(avgRate) }]}>{avgRate}%</Text>
              <Text style={styles.summaryLbl}>Avg Rate</Text>
            </View>
            {longestStreak > 0 && (
              <>
                <View style={styles.summaryDiv} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryVal, { color: theme.accent }]}>{longestStreak}</Text>
                  <Text style={styles.summaryLbl}>Best Streak</Text>
                </View>
              </>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
          </View>

          {/* Snapshot cards */}
          {sorted.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyGlyph}>☽</Text>
              <Text style={styles.emptyTitle}>No chapters yet</Text>
              <Text style={styles.emptyBody}>
                Your monthly chronicles will appear here at the end of each moon cycle.
              </Text>
            </View>
          ) : (
            sorted.map((snap, idx) => (
              <SnapshotCard key={snap.month} snap={snap} defaultExpanded={idx === 0} />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#C9A84C',
    letterSpacing: 0.5,
    fontFamily: theme.fonts.serif,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryVal: { fontSize: 22, fontWeight: '700' },
  summaryLbl: { fontSize: 10, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', marginTop: 2, letterSpacing: 0.3 },
  summaryDiv: { width: 1, height: 28, backgroundColor: theme.border },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20, paddingHorizontal: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.2)' },
  dividerGlyph: { fontSize: 13, color: '#C9A84C' },

  // Snapshot card
  card: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardAccentBar: { width: 4 },
  cardInner: { flex: 1, padding: 14 },

  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  cardHeaderLeft: { flex: 1 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMonthLabel: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, fontFamily: theme.fonts.serif },
  cardStatusLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  cardRate: { fontSize: 20, fontWeight: '700' },

  barBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
  barFill: { height: 4, borderRadius: 2 },

  quickStats: { flexDirection: 'row', alignItems: 'center' },
  quickStat: { alignItems: 'center', flex: 1 },
  quickStatVal: { fontSize: 16, fontWeight: '700' },
  quickStatLbl: { fontSize: 9, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', marginTop: 1, letterSpacing: 0.3 },
  quickStatDiv: { width: 1, height: 24, backgroundColor: theme.border },

  // Expanded
  expandedSection: { marginTop: 14, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 14, gap: 12 },
  expandedBlock: { gap: 4 },
  expandedBlockTitle: { fontSize: 10, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },

  intentionBox: { backgroundColor: 'rgba(201,168,76,0.07)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.18)' },
  intentionBoxLabel: { fontSize: 9, fontWeight: '700', color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  intentionBoxText: { fontSize: 14, color: '#F5D5E0', fontFamily: theme.fonts.serif, fontStyle: 'italic', lineHeight: 20 },

  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: theme.border },
  catName: { flex: 1, fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  catCount: { fontSize: 11, fontWeight: '600', color: theme.textMuted },

  missedItem: { fontSize: 12, color: theme.textMuted, paddingVertical: 2, fontStyle: 'italic' },
  missedMore: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  completedItem: { fontSize: 12, color: theme.success, paddingVertical: 2 },

  // Empty state
  emptyCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  emptyGlyph: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary, fontFamily: theme.fonts.serif, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' },
});
