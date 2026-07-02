import React from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ManifestationRecord } from '../services/mockData';

interface ManifestationInsightsProps {
  manifestations: ManifestationRecord[];
}

interface ManifestationTimings {
  fastest: number;
  slowest: number;
  average: number;
  median: number;
  total: number;
}

export default function ManifestationInsights({ manifestations }: ManifestationInsightsProps) {
  const [showModal, setShowModal] = React.useState(false);

  // Calculate timings for spilled manifestations
  const spilledManifestations = manifestations.filter(m => m.status === 'spilled');

  const timings: number[] = spilledManifestations
    .map(m => {
      const spillResult = m.results.find(r => r.type === 'manifested');
      if (!spillResult) return null;

      const daysToManifest = Math.ceil(
        (new Date(spillResult.date).getTime() - new Date(m.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysToManifest;
    })
    .filter((d): d is number => d !== null)
    .sort((a, b) => a - b);

  if (timings.length === 0) {
    return null;
  }

  const stats: ManifestationTimings = {
    fastest: timings[0],
    slowest: timings[timings.length - 1],
    average: Math.round(timings.reduce((a, b) => a + b, 0) / timings.length),
    median: timings[Math.floor(timings.length / 2)],
    total: timings.length,
  };

  // Distribution buckets
  const buckets = {
    '0-7 days': timings.filter(d => d <= 7).length,
    '1-2 weeks': timings.filter(d => d > 7 && d <= 14).length,
    '2-4 weeks': timings.filter(d => d > 14 && d <= 28).length,
    '1+ months': timings.filter(d => d > 28).length,
  };

  const maxBucketCount = Math.max(...Object.values(buckets));

  const distributionPercentage = (count: number) => {
    return maxBucketCount > 0 ? Math.round((count / maxBucketCount) * 100) : 0;
  };

  return (
    <>
      <Pressable style={styles.container} onPress={() => setShowModal(true)}>
        <View style={styles.header}>
          <Text style={styles.title}>Manifestation Timeline</Text>
          <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Fastest</Text>
            <Text style={styles.statValue}>{stats.fastest}d</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Average</Text>
            <Text style={styles.statValue}>{stats.average}d</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Slowest</Text>
            <Text style={styles.statValue}>{stats.slowest}d</Text>
          </View>
        </View>
      </Pressable>

      {/* Detailed modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manifestation Timeline</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.textPrimary} />
              </Pressable>
            </View>

            {/* Key stats */}
            <View style={styles.keyStats}>
              <View style={styles.keyStat}>
                <Text style={styles.keyStatLabel}>Total Manifested</Text>
                <Text style={styles.keyStatValue}>{stats.total}</Text>
              </View>
              <View style={styles.keyStatDivider} />
              <View style={styles.keyStat}>
                <Text style={styles.keyStatLabel}>Median Time</Text>
                <Text style={styles.keyStatValue}>{stats.median} days</Text>
              </View>
              <View style={styles.keyStatDivider} />
              <View style={styles.keyStat}>
                <Text style={styles.keyStatLabel}>Range</Text>
                <Text style={styles.keyStatValue}>{stats.fastest}–{stats.slowest}d</Text>
              </View>
            </View>

            {/* Distribution */}
            <Text style={styles.sectionTitle}>Distribution</Text>
            <View style={styles.distributionContainer}>
              {Object.entries(buckets).map(([label, count]) => (
                <View key={label} style={styles.distributionRow}>
                  <Text style={styles.distributionLabel}>{label}</Text>
                  <View style={styles.distributionBar}>
                    <View
                      style={[
                        styles.distributionBarFill,
                        {
                          width: `${distributionPercentage(count)}%`,
                          backgroundColor: count === 0 ? theme.border : '#7ED4A8',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.distributionCount}>{count}</Text>
                </View>
              ))}
            </View>

            {/* Insight */}
            <View style={styles.insight}>
              <MaterialIcons name="lightbulb" size={16} color={theme.primary} />
              <Text style={styles.insightText}>
                Your manifestations typically come within{' '}
                <Text style={{ fontWeight: '700' }}>{stats.median} days</Text> of intention.
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7ED4A8',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.border,
    marginHorizontal: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },

  keyStats: {
    flexDirection: 'row',
    backgroundColor: theme.primary + '10',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  keyStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  keyStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  keyStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.primary,
  },
  keyStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.primary + '30',
    marginHorizontal: 8,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  distributionContainer: {
    gap: 10,
    marginBottom: 20,
  },
  distributionRow: {
    gap: 8,
    alignItems: 'center',
  },
  distributionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textPrimary,
    width: 90,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
    width: 20,
    textAlign: 'right',
  },

  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.primary + '10',
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  insightText: {
    fontSize: 12,
    color: theme.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
