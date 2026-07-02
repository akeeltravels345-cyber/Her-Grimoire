import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  AccessibilityInfo,
  AccessibilityRole,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Ritual, ManifestationRecord } from '../services/mockData';
import { PracticeCategory } from '../constants/config';

interface CategoryStats {
  categoryId: string;
  categoryName: string;
  completed: number;
  scheduled: number;
  percentage: number;
  color: string;
}

interface VisualizationProps {
  rituals: Ritual[];
  categories: PracticeCategory[];
  categoryColors: Record<string, string>;
  manifestations: ManifestationRecord[];
}

/**
 * Simple Pie Chart Component using SVG-like rendering
 */
const PieChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  title: string;
}> = ({ data, title }) => {
  const width = Dimensions.get('window').width - 40;
  const radius = Math.min(width, 200) / 2;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartDiameter = radius * 2;

  let currentAngle = 0;
  const slices = data.map((item) => {
    const sliceAngle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    return {
      ...item,
      startAngle,
      endAngle,
      percentage: ((item.value / total) * 100).toFixed(1),
    };
  });

  return (
    <View
      style={styles.chartContainer}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${data.map(d => `${d.label}: ${d.value}`).join(', ')}`}
    >
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={[styles.chartArea, { width, minHeight: chartDiameter }]}>
        <View
          style={[
            styles.pieChartPlaceholder,
            {
              width: chartDiameter,
              height: chartDiameter,
              borderRadius: radius,
            },
          ]}
        >
          {/* Simplified pie representation using colored circles */}
          {slices.slice(0, 1).length > 0 && (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: slices[0].color,
                  borderRadius: radius,
                },
              ]}
            />
          )}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {slices.map((slice, index) => (
          <View
            key={index}
            style={styles.legendItem}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${slice.label}: ${slice.percentage}%`}
          >
            <View
              style={[styles.legendColor, { backgroundColor: slice.color }]}
            />
            <View style={styles.legendText}>
              <Text style={styles.legendLabel}>{slice.label}</Text>
              <Text style={styles.legendValue}>
                {slice.value} ({slice.percentage}%)
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * Bar Chart Component for category completion
 */
const BarChart: React.FC<{
  data: CategoryStats[];
  title: string;
}> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.scheduled), 1);
  const barHeight = 200;

  return (
    <View
      style={styles.chartContainer}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${data.map(d => `${d.categoryName}: ${d.completed} of ${d.scheduled}`).join(', ')}`}
    >
      <Text style={styles.chartTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.barChartContainer}>
        <View style={styles.barChartContent}>
          {data.map((item, index) => (
            <View
              key={index}
              style={styles.barGroup}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`${item.categoryName}: ${item.completed} completed out of ${item.scheduled} scheduled`}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: 'transparent',
                  },
                ]}
              >
                {/* Completed bar */}
                <View
                  style={[
                    styles.barSegment,
                    {
                      height: (item.completed / maxValue) * barHeight,
                      backgroundColor: item.color,
                      opacity: 1,
                    },
                  ]}
                />
                {/* Remaining bar */}
                {item.scheduled > item.completed && (
                  <View
                    style={[
                      styles.barSegment,
                      {
                        height: ((item.scheduled - item.completed) / maxValue) * barHeight,
                        backgroundColor: item.color,
                        opacity: 0.4,
                      },
                    ]}
                  />
                )}
              </View>
              <Text style={styles.barLabel} numberOfLines={2}>
                {item.categoryName}
              </Text>
              <Text style={styles.barValue}>
                {item.completed}/{item.scheduled}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * Timeline Component for manifestations
 */
const ManifestationTimeline: React.FC<{
  manifestations: ManifestationRecord[];
}> = ({ manifestations }) => {
  const sortedManifestations = useMemo(() => {
    return [...manifestations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [manifestations]);

  return (
    <View
      style={styles.chartContainer}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel="Manifestation Timeline"
    >
      <Text style={styles.chartTitle}>Manifestation Timeline</Text>
      <View style={styles.timelineContainer}>
        {sortedManifestations.map((manif, index) => {
          const statusColor =
            manif.status === 'manifested'
              ? '#4CAF50'
              : manif.status === 'brewing'
              ? '#2196F3'
              : '#FF9800';

          return (
            <View
              key={manif.id}
              style={styles.timelineItem}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`${manif.ritualName}: ${manif.status}. Created ${new Date(manif.createdAt).toLocaleDateString()}`}
            >
              <View style={[styles.timelineMarker, { backgroundColor: statusColor }]}>
                <MaterialIcons
                  name={
                    manif.status === 'manifested'
                      ? 'check-circle'
                      : manif.status === 'brewing'
                      ? 'hourglass-empty'
                      : 'auto-awesome'
                  }
                  size={20}
                  color="white"
                />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{manif.ritualName}</Text>
                <Text style={styles.timelineDate}>
                  {new Date(manif.createdAt).toLocaleDateString()} • {manif.status}
                </Text>
                {manif.intention && (
                  <Text style={styles.timelineIntention} numberOfLines={2}>
                    {manif.intention}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

/**
 * Main Data Visualization Dashboard Component
 */
const DataVisualization: React.FC<VisualizationProps> = ({
  rituals,
  categories,
  categoryColors,
  manifestations,
}) => {
  // Category statistics
  const categoryStats = useMemo(() => {
    return categories
      .map((cat) => {
        const completed = rituals.filter(
          r => r.status === 'completed' && r.categories?.includes(cat.id)
        ).length;
        const scheduled = rituals.filter(r => r.categories?.includes(cat.id)).length;

        return {
          categoryId: cat.id,
          categoryName: cat.name,
          completed,
          scheduled,
          percentage: scheduled > 0 ? (completed / scheduled) * 100 : 0,
          color: categoryColors[cat.id] || theme.colors.primary,
        };
      })
      .filter(stat => stat.scheduled > 0);
  }, [rituals, categories, categoryColors]);

  // Manifestation status distribution
  const manifestationStats = useMemo(() => {
    const statuses = {
      manifested: manifestations.filter(m => m.status === 'manifested').length,
      brewing: manifestations.filter(m => m.status === 'brewing').length,
      dispersing: manifestations.filter(m => m.status === 'dispersing').length,
    };

    return [
      { label: 'Manifested', value: statuses.manifested, color: '#4CAF50' },
      { label: 'Brewing', value: statuses.brewing, color: '#2196F3' },
      { label: 'Dispersing', value: statuses.dispersing, color: '#FF9800' },
    ].filter(item => item.value > 0);
  }, [manifestations]);

  // Completion rate trend
  const completionRate = useMemo(() => {
    const totalScheduled = rituals.filter(r => r.scheduledDate).length;
    const totalCompleted = rituals.filter(r => r.status === 'completed').length;
    return totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
  }, [rituals]);

  if (categoryStats.length === 0 && manifestationStats.length === 0) {
    return (
      <View
        style={styles.emptyContainer}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="No data to display yet"
      >
        <MaterialIcons name="bar-chart" size={48} color={theme.colors.placeholder} />
        <Text style={styles.emptyText}>
          Complete rituals to see visualization data
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Overall Stats Header */}
      <View
        style={styles.statsHeader}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`Overall Statistics: ${completionRate}% completion rate`}
      >
        <View style={styles.statCard}>
          <MaterialIcons name="trending-up" size={32} color={theme.colors.primary} />
          <Text style={styles.statValue}>{completionRate}%</Text>
          <Text style={styles.statLabel}>Completion Rate</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="assignment-turned-in" size={32} color="#4CAF50" />
          <Text style={styles.statValue}>
            {rituals.filter(r => r.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="light-mode" size={32} color="#FF9800" />
          <Text style={styles.statValue}>{manifestations.length}</Text>
          <Text style={styles.statLabel}>Manifestations</Text>
        </View>
      </View>

      {/* Category Distribution */}
      {categoryStats.length > 0 && <BarChart data={categoryStats} title="Category Progress" />}

      {/* Manifestation Status */}
      {manifestationStats.length > 0 && (
        <PieChart data={manifestationStats} title="Manifestation Status" />
      )}

      {/* Manifestation Timeline */}
      {manifestations.length > 0 && (
        <ManifestationTimeline manifestations={manifestations} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  chartArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pieChartPlaceholder: {
    backgroundColor: theme.colors.primary,
  },
  legend: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 3,
    marginTop: 2,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
  },
  legendValue: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  barChartContainer: {
    marginBottom: 12,
  },
  barChartContent: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 12,
  },
  barGroup: {
    alignItems: 'center',
    gap: 8,
    minWidth: 60,
  },
  bar: {
    width: 40,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barSegment: {
    width: '100%',
  },
  barLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 60,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  timelineContainer: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  timelineMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
    paddingRight: 8,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  timelineDate: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  timelineIntention: {
    fontSize: 12,
    color: theme.colors.text,
    marginTop: 4,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default DataVisualization;
