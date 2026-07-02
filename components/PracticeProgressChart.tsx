import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, Dimensions, ScrollView,
} from 'react-native';
import { theme } from '../constants/theme';
import { Ritual } from '../services/mockData';

interface PracticeProgressChartProps {
  rituals: Ritual[];
  timeframe?: 'week' | 'month' | 'quarter';
}

/**
 * PracticeProgressChart - Shows historical practice data as a bar chart
 * Displays rituals performed over selected timeframe
 */
export default function PracticeProgressChart({
  rituals,
  timeframe = 'month',
}: PracticeProgressChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const data: { date: string; count: number; dayName: string }[] = [];

    // Calculate days based on timeframe
    const daysToShow = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

      // Count rituals performed on this date
      let count = 0;
      rituals.forEach(ritual => {
        ritual.journal.forEach(entry => {
          if (entry.date.split('T')[0] === dateStr) {
            count++;
          }
        });
      });

      data.push({ date: dateStr, count, dayName });
    }

    return data;
  }, [rituals, timeframe]);

  const maxCount = Math.max(...chartData.map(d => d.count), 1);
  const screenWidth = Dimensions.get('window').width;
  const barWidth = Math.max(20, (screenWidth - 60) / Math.min(chartData.length, 15));

  const stats = useMemo(() => {
    const totalPractices = chartData.reduce((sum, d) => sum + d.count, 0);
    const daysActive = chartData.filter(d => d.count > 0).length;
    const avgPerDay = daysActive > 0 ? (totalPractices / daysActive).toFixed(1) : '0';
    const maxDay = Math.max(...chartData.map(d => d.count));

    return { totalPractices, daysActive, avgPerDay, maxDay };
  }, [chartData]);

  return (
    <View style={styles.container}>
      {/* Header with Title and Stats */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Practice Progress</Text>
          <Text style={styles.timeframe}>
            {timeframe === 'week' ? 'Last 7 days' : timeframe === 'month' ? 'Last 30 days' : 'Last 90 days'}
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.totalPractices}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.daysActive}</Text>
          <Text style={styles.statLabel}>Active Days</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.avgPerDay}</Text>
          <Text style={styles.statLabel}>Avg/Day</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.maxDay}</Text>
          <Text style={styles.statLabel}>Peak</Text>
        </View>
      </View>

      {/* Chart */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chartContainer}
        contentContainerStyle={styles.chartContent}
      >
        <View style={styles.chart}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            {[maxCount, Math.floor(maxCount * 0.67), Math.floor(maxCount * 0.33), 0].map((val) => (
              <Text key={val} style={styles.yAxisLabel}>{val}</Text>
            ))}
          </View>

          {/* Bar chart */}
          <View style={styles.bars}>
            {chartData.map((dataPoint, index) => {
              const height = maxCount > 0 ? (dataPoint.count / maxCount) * 120 : 0;
              const isRecent = index >= chartData.length - 7;

              return (
                <View
                  key={dataPoint.date}
                  style={[styles.barWrapper, { width: barWidth, opacity: isRecent ? 1 : 0.6 }]}
                >
                  <View style={styles.barContainer}>
                    {height > 0 ? (
                      <View
                        style={[
                          styles.bar,
                          {
                            height,
                            backgroundColor: dataPoint.count > 0 ? theme.primary : theme.surfaceLight,
                          },
                        ]}
                      />
                    ) : (
                      <View style={[styles.emptyBar, { opacity: 0.2 }]} />
                    )}
                  </View>
                  {chartData.length <= 14 && (
                    <Text style={styles.barLabel}>{dataPoint.dayName}</Text>
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
          <Text style={styles.legendText}>Practices logged</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.surfaceLight }]} />
          <Text style={styles.legendText}>No activity</Text>
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
    height: 120,
    paddingRight: 8,
    width: 30,
  },
  yAxisLabel: {
    fontSize: 9,
    color: theme.textMuted,
    fontWeight: '600',
    textAlign: 'right',
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-end',
  },
  barWrapper: {
    gap: 4,
    alignItems: 'center',
  },
  barContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  emptyBar: {
    width: '100%',
    height: 1,
    backgroundColor: theme.surfaceLight,
  },
  barLabel: {
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
