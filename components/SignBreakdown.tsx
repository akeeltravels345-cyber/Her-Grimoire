import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ManifestationRecord, SignType } from '../services/mockData';

const SIGN_TYPES: SignType[] = ['dream', 'omen', 'encounter', 'symbol', 'number', 'synchronicity'];

const SIGN_CONFIG: Record<SignType, { emoji: string; label: string; color: string }> = {
  dream:       { emoji: '🌙', label: 'Dream',            color: '#6667AB' },
  omen:        { emoji: '🦅', label: 'Omen',             color: '#C9A0DC' },
  encounter:   { emoji: '👁️', label: 'Encounter',        color: '#4EA8DE' },
  symbol:      { emoji: '✦', label: 'Symbol',           color: '#F5D5E0' },
  number:      { emoji: '🔢', label: 'Repeated Number',  color: '#B8B0E8' },
  synchronicity: { emoji: '✨', label: 'Synchronicity',  color: '#7ED4A8' },
};

interface SignBreakdownProps {
  manifestations: ManifestationRecord[];
}

interface SignStats {
  type: SignType;
  count: number;
  spilCount: number;
  percentage: number;
}

export default function SignBreakdown({ manifestations }: SignBreakdownProps) {
  const [showModal, setShowModal] = useState(false);

  // Count signs by type
  const signCounts: Record<SignType, number> = {
    dream: 0, omen: 0, encounter: 0, symbol: 0, number: 0, synchronicity: 0,
  };

  const spilledWithSignType: Record<SignType, number> = {
    dream: 0, omen: 0, encounter: 0, symbol: 0, number: 0, synchronicity: 0,
  };

  manifestations.forEach(m => {
    m.results.forEach(r => {
      if (r.type === 'sign' && r.signType) {
        signCounts[r.signType]++;

        // Count if this manifestation was spilled
        if (m.status === 'spilled') {
          spilledWithSignType[r.signType]++;
        }
      }
    });
  });

  const totalSigns = Object.values(signCounts).reduce((a, b) => a + b, 0);

  const signStats: SignStats[] = SIGN_TYPES
    .map(type => ({
      type,
      count: signCounts[type],
      spilCount: spilledWithSignType[type],
      percentage: totalSigns > 0 ? Math.round((signCounts[type] / totalSigns) * 100) : 0,
    }))
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);

  if (signStats.length === 0) {
    return null;
  }

  return (
    <>
      <Pressable
        style={styles.container}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your Sign Patterns</Text>
          <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
        </View>

        <View style={styles.signGrid}>
          {signStats.map(stat => {
            const cfg = SIGN_CONFIG[stat.type];
            return (
              <View key={stat.type} style={styles.signGridItem}>
                <Text style={styles.signEmoji}>{cfg.emoji}</Text>
                <Text style={styles.signCount}>{stat.count}</Text>
                <Text style={styles.signLabel}>{cfg.label}</Text>
              </View>
            );
          })}
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
              <Text style={styles.modalTitle}>Sign Type Breakdown</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.statsContainer}>
              {signStats.map(stat => {
                const cfg = SIGN_CONFIG[stat.type];
                const spilledPercentage = stat.count > 0
                  ? Math.round((stat.spilCount / stat.count) * 100)
                  : 0;

                return (
                  <View key={stat.type} style={styles.statRow}>
                    <View style={styles.statLeft}>
                      <Text style={styles.statEmoji}>{cfg.emoji}</Text>
                      <View>
                        <Text style={styles.statName}>{cfg.label}</Text>
                        <Text style={styles.statSubtext}>
                          {stat.count} tracked
                          {stat.spilCount > 0 ? ` · ${spilledPercentage}% led to manifestation` : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statRight}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: cfg.color,
                              width: `${stat.percentage}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.percentage, { color: cfg.color }]}>
                        {stat.percentage}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.insight}>
              <MaterialIcons name="lightbulb" size={16} color={theme.primary} />
              <Text style={styles.insightText}>
                Most common sign type: <Text style={{ fontWeight: '700' }}>
                  {SIGN_CONFIG[signStats[0].type].label}
                </Text>
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
  signGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  signGridItem: {
    width: '30%',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  signEmoji: {
    fontSize: 24,
  },
  signCount: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.primary,
  },
  signLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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

  statsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statEmoji: {
    fontSize: 20,
  },
  statName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  statSubtext: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  statRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  progressBar: {
    width: 100,
    height: 6,
    backgroundColor: theme.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '700',
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
