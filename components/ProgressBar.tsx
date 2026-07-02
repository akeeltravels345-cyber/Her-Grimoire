import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../constants/theme';

interface ProgressBarProps {
  progress: number; // 0-1
  label?: string;
  showPercentage?: boolean;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  borderRadius?: number;
  animated?: boolean;
  variant?: 'default' | 'compact'; // 'default' shows label, 'compact' is minimal
}

export default function ProgressBar({
  progress,
  label,
  showPercentage = true,
  height = 12,
  backgroundColor = theme.surfaceLight,
  fillColor = theme.primary,
  borderRadius = 6,
  animated = true,
  variant = 'default',
}: ProgressBarProps) {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const percentage = Math.round(clampedProgress * 100);

  // Animated value for smooth fill animation
  const animatedWidth = React.useRef(new Animated.Value(clampedProgress)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: clampedProgress,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(clampedProgress);
    }
  }, [clampedProgress, animated, animatedWidth]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (variant === 'compact') {
    return (
      <View style={[styles.compactContainer, { height }]}>
        <View style={[styles.compactBar, { backgroundColor, borderRadius }]}>
          <Animated.View
            style={[
              styles.compactFill,
              {
                width: widthInterpolation,
                backgroundColor: fillColor,
                borderRadius,
              },
            ]}
          />
        </View>
        {showPercentage && (
          <Text style={styles.compactPercentage}>{percentage}%</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Label and percentage row */}
      {label && (
        <View style={styles.headerRow}>
          <Text style={styles.label}>{label}</Text>
          {showPercentage && (
            <Text style={[styles.percentage, { color: fillColor }]}>
              {percentage}%
            </Text>
          )}
        </View>
      )}

      {/* Progress bar track */}
      <View style={[styles.trackContainer, { height, backgroundColor, borderRadius }]}>
        {/* Animated fill */}
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterpolation,
              backgroundColor: fillColor,
              borderRadius,
            },
          ]}
        >
          {/* Shimmer overlay for visual polish */}
          <View style={[styles.shimmer, { borderRadius }]} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...theme.typography.bodySmall,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  percentage: {
    ...theme.typography.badge,
    fontWeight: '700',
  },
  trackContainer: {
    width: '100%',
    backgroundColor: theme.surfaceLight,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    position: 'relative',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    opacity: 0.6,
  },
  // Compact variant styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactBar: {
    flex: 1,
    backgroundColor: theme.surfaceLight,
    overflow: 'hidden',
  },
  compactFill: {
    height: '100%',
  },
  compactPercentage: {
    ...theme.typography.badge,
    color: theme.textSecondary,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
});
