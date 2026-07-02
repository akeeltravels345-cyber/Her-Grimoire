import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, Dimensions, ScrollView,
} from 'react-native';
import { theme } from '../constants/theme';
import { ManifestationRecord } from '../services/mockData';

interface ManifestationProgressChartProps {
  manifestations: ManifestationRecord[];
  timeframe?: 'week' | 'month' | 'quarter';
}

/**
 * ManifestationProgressChart - Shows manifestation signs and progress over time
 * Displays line chart of manifestation activity and current status distribution
 */
export default function ManifestationProgressChart({
  manifestations,
  timeframe = 'month',
}: ManifestationProgressChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const data: { date: string; signs: number; manifestations: number; dayName: string }[] = [];

    const daysToShow = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

      let signs = 0;
      let manifestations = 0;

      // Count signs and manifestations for this date
      manifestations.forEach(m => {
        m.results.forEach(result => {
          if (result.date.split('T')[0] === dateStr) {
            if (result.type === 'sign') signs++;
            else if (result.type === 'manifested') manifestations++;
          }
        });
      });

      data.push({ date: dateStr, signs, manifestations, dayName });
    }

    return data;
  }, [manifestations, timeframe]);

  const maxValue = Math.max(
    ...chartData.map(d => d.signs + d.manifestations),
    1,
  );

  const screenWidth = Dimensions.get('window').width;
  const pointWidth = Math.max(16, (screenWidth - 60) / Math.min(chartData.length, 15));

  const stats = useMemo(() => {
    const totalSigns = chartData.reduce((sum, d) => sum + d.signs, 0);
    const totalManifested = chartData.reduce((sum, d) => sum + d.manifestations, 0);
    const daysWithSigns = chartData.filter(d => d.signs > 0).length;
    const daysWithManifestations = chartData.filter(d => d.manifestations > 0).length;

    const brewingCount = manifestations.filter(m => m.status === 'brewing').length;
    const stirringCount = manifestations.filter(m => m.status === 'stirring').length;
    const spilledCount = manifestations.filter(m => m.status === 'spilled').length;

    return {
      totalSigns,
      totalManifested,
      daysWithSigns,
      daysWithManifestations,
      brewing: brewingCount,
      stirring: stirringCount,
      spilled: spilledCount,
    };
  }, [chartData, manifestations]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Manifestation Progress</Text>
          <Text style={styles.timeframe}>
            {timeframe === 'week' ? 'Last 7 days' : timeframe === 'month' ? 'Last 30 days' : 'Last 90 days'}
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.totalSigns}</Text>
          <Text style={styles.statLabel}>Signs</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.totalManifested}</Text>
          <Text style={styles.statLabel}>Manifested</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.daysWithSigns}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Status Distribution */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionLabel}>Current Status</Text>
        <View style={styles.statusBars}>
          {stats.brewing > 0 && (
            <View style={styles.statusBar}>
              <View style={[styles.statusIndicator, { backgroundColor: '#7C5CBF' }]} />
              <Text style={styles.statusText}>
                <Text style={styles.statusCount}>{stats.brewing}</Text>
                {' '}Brewing
              </Text>
            </View>
          )}
          {stats.stirring > 0 && (
            <View style={styles.statusBar}>
              <View style={[styles.statusIndicator, { backgroundColor: '#E8C87A' }]} />
              <Text style={styles.statusText}>
                <Text style={styles.statusCount}>{stats.stirring}</Text>
                {' '}Stirring
              </Text>
            </View>
          )}
          {stats.spilled > 0 && (
            <View style={styles.statusBar}>
              <View style={[styles.statusIndicator, { backgroundColor: '#7ED4A8' }]} />
              <Text style={styles.statusText}>
                <Text style={styles.statusCount}>{stats.spilled}</Text>
                {' '}Spilled
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Activity Chart */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chartContainer}
        contentContainerStyle={styles.chartContent}
      >
        <View style={styles.chart}>
          {/* Y-axis */}
          <View style={styles.yAxis}>
            {[maxValue, Math.floor(maxValue * 0.67), Math.floor(maxValue * 0.33), 0].map((val) => (
              <Text key={val} style={styles.yAxisLabel}>{val}</Text>
            ))}
          </View>

          {/* Points */}
          <View style={styles.points}>
            {chartData.map((dataPoint, index) => {
              const total = dataPoint.signs + dataPoint.manifestations;
              const height = maxValue > 0 ? (total / maxValue) * 100 : 0;
              const isRecent = index >= chartData.length - 7;

              return (
                <View
                  key={dataPoint.date}
                  style={[styles.pointWrapper, { width: pointWidth, opacity: isRecent ? 1 : 0.5 }]}
                >
                  <View style={styles.pointContainer}>
                    {total > 0 ? (
                      <View style={styles.point}>
                        {/* Stacked indicators */}
                        {dataPoint.signs > 0 && (
                          <View
                            style={[
                              styles.pointSegment,
                              {
                                height: (dataPoint.signs / total) * 10,
                                backgroundColor: theme.primary,
                                borderTopLeftRadius: 4,
                                borderTopRightRadius: 4,
                              },
                            ]}
                          />
                        )}
                        {dataPoint.manifestations > 0 && (
                          <View
                            style={[
                              styles.pointSegment,
                              {
                                height: (dataPoint.manifestations / total) * 10,
                                backgroundColor: '#7ED4A8',
                                borderBottomLeftRadius: 4,
                                borderBottomRightRadius: 4,
                              },
                            ]}
                          />
                        )}
                      </View>
                    ) : null}
                  </View>
                  {chartData.length <= 14 && (
                    <Text style={styles.pointLabel}>{dataPoint.dayName}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.primary }]} />
          <Text style={styles.legendText}>Signs noticed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#7ED4A8' }]} />
          <Text style={styles.legendText}>Manifested</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  timeframe: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.primary + '25',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.primary,
  },
  statLabel: {
    fontSize: 9,
    color: theme.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statusSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBars: {
    gap: 6,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: theme.background,
    borderRadius: 10,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  statusCount: {
    fontWeight: '700',
    color: theme.textPrimary,
  },
  chartContainer: {
    marginVertical: 8,
  },
  chartContent: {
    paddingHorizontal: 8,
  },
  chart: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  yAxis: {
    justifyContent: 'space-between',
    height: 100,
    paddingRight: 8,
    width: 30,
  },
  yAxisLabel: {
    fontSize: 9,
    color: theme.textMuted,
    fontWeight: '600',
    textAlign: 'right',
  },
  points: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-end',
  },
  pointWrapper: {
    gap: 4,
    alignItems: 'center',
  },
  pointContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  point: {
    width: 12,
    alignItems: 'center',
  },
  pointSegment: {
    width: '100%',
  },
  pointLabel: {
    fontSize: 8,
    color: theme.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '500',
  },
});
