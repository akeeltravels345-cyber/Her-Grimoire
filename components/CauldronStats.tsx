import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { ManifestationRecord } from '../services/mockData';
import ProgressBar from './ProgressBar';

interface CauldronStatsProps {
  manifestations: ManifestationRecord[];
  onStatPress?: (statId: string) => void; // Optional callback for stat card presses
}

export default function CauldronStats({ manifestations, onStatPress }: CauldronStatsProps) {
  const router = useRouter();

  // Calculate total spilled
  const totalSpilled = manifestations.filter(m => m.status === 'spilled').length;

  // Calculate this month's spilled
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthSpilled = manifestations.filter(m => {
    if (m.status !== 'spilled') return false;
    const spillResult = m.results.find(r => r.type === 'manifested');
    if (!spillResult) return false;
    return new Date(spillResult.date) >= thisMonthStart;
  }).length;

  // Calculate brewing and stirring manifestations for progress
  const brewingCount = manifestations.filter(m => m.status === 'brewing').length;
  const stirringCount = manifestations.filter(m => m.status === 'stirring').length;
  const activeCount = brewingCount + stirringCount;
  const totalCount = manifestations.length || 1;

  // Calculate streak (consecutive weeks with at least 1 spilled)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const spilledByWeek = new Set<string>();
  manifestations.forEach(m => {
    if (m.status === 'spilled') {
      const spillResult = m.results.find(r => r.type === 'manifested');
      if (spillResult) {
        const weekKey = getWeekStart(new Date(spillResult.date)).toISOString().split('T')[0];
        spilledByWeek.add(weekKey);
      }
    }
  });

  // Get weeks sorted in reverse (most recent first)
  const sortedWeeks = Array.from(spilledByWeek)
    .map(weekKey => new Date(weekKey))
    .sort((a, b) => b.getTime() - a.getTime());

  // Calculate consecutive week streak
  let streak = 0;
  if (sortedWeeks.length > 0) {
    const now = new Date();
    const currentWeekStart = getWeekStart(now);
    let checkDate = new Date(currentWeekStart);

    for (const week of sortedWeeks) {
      const weekStart = getWeekStart(week);
      const weekDiff = Math.floor(
        (checkDate.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );

      if (weekDiff === 0) {
        streak++;
        checkDate = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  const manifestationProgress = totalCount > 0 ? (totalSpilled / totalCount) : 0;

  const stats = [
    {
      id: 'spilled',
      icon: '✨',
      value: totalSpilled,
      label: 'Spilled',
      desc: 'all time',
      color: '#7ED4A8',
    },
    {
      id: 'this-month',
      icon: '🌙',
      value: thisMonthSpilled,
      label: 'This Month',
      desc: new Date().toLocaleDateString('en-US', { month: 'long' }),
      color: '#C9A0DC',
    },
    {
      id: 'streak',
      icon: '🔥',
      value: streak,
      label: 'Week Streak',
      desc: 'consecutive',
      color: '#F5A962',
    },
  ];

  const handleStatPress = (statId: string) => {
    Haptics.selectionAsync();
    if (onStatPress) {
      onStatPress(statId);
    }
  };

  return (
    <View style={styles.container}>
      {stats.map((stat, idx) => (
        <Pressable
          key={idx}
          style={({ pressed }) => [
            styles.statItem,
            { borderLeftColor: stat.color },
            pressed && styles.statItemPressed,
          ]}
          onPress={() => handleStatPress(stat.id)}
          disabled={false}
        >
          <Text style={styles.statIcon}>{stat.icon}</Text>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statDesc}>{stat.desc}</Text>
          </View>
        </Pressable>
      ))}

      {/* Overall manifestation progress card */}
      {manifestations.length > 0 && (
        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <Text style={styles.progressCardLabel}>MANIFESTATION PROGRESS</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(manifestationProgress * 100)}%
            </Text>
          </View>
          <ProgressBar
            progress={manifestationProgress}
            label={`${totalSpilled} of ${totalCount} manifested`}
            showPercentage={false}
            height={10}
            fillColor={theme.primary}
            animated={true}
            variant="compact"
          />
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatEmoji}>🫖</Text>
              <Text style={styles.progressStatLabel}>Brewing</Text>
              <Text style={styles.progressStatValue}>{brewingCount}</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatEmoji}>🌀</Text>
              <Text style={styles.progressStatLabel}>Stirring</Text>
              <Text style={styles.progressStatValue}>{stirringCount}</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatEmoji}>✨</Text>
              <Text style={styles.progressStatLabel}>Manifested</Text>
              <Text style={styles.progressStatValue}>{totalSpilled}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.surface,
    borderLeftWidth: 3,
    borderRadius: 12,
    padding: 14,
    ...theme.shadows.card,
  },
  statItemPressed: {
    opacity: 0.8,
    backgroundColor: 'rgba(201, 160, 220, 0.1)',
  },
  statIcon: {
    fontSize: 28,
  },
  statContent: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDesc: {
    fontSize: 10,
    color: theme.textMuted,
    fontStyle: 'italic',
  },
  progressCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    ...theme.shadows.card,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.primary,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  progressStat: {
    alignItems: 'center',
    gap: 4,
  },
  progressStatEmoji: {
    fontSize: 18,
  },
  progressStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  progressStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
  },
});
