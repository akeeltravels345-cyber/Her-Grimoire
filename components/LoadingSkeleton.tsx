import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../constants/theme';

interface SkeletonLineProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  marginBottom?: number;
  style?: any;
}

export const SkeletonLine: React.FC<SkeletonLineProps> = ({
  width = '100%',
  height = 12,
  borderRadius = 6,
  marginBottom = 12,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.6,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          marginBottom,
          opacity: shimmerAnim,
        },
        style,
      ]}
    />
  );
};

interface CardSkeletonProps {
  height?: number;
  showHeader?: boolean;
  lineCount?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  height = 200,
  showHeader = true,
  lineCount = 3,
}) => {
  return (
    <View style={styles.cardContainer}>
      {showHeader && (
        <View style={styles.headerSection}>
          <SkeletonLine width={200} height={20} borderRadius={8} marginBottom={8} />
          <SkeletonLine width={150} height={14} borderRadius={6} marginBottom={0} />
        </View>
      )}

      <View style={styles.contentSection}>
        {Array.from({ length: lineCount }).map((_, i) => (
          <SkeletonLine
            key={i}
            width={i === lineCount - 1 ? '80%' : '100%'}
            height={12}
            borderRadius={6}
            marginBottom={i === lineCount - 1 ? 0 : 10}
          />
        ))}
      </View>
    </View>
  );
};

interface DetailPageSkeletonProps {
  showImage?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  contentLineCount?: number;
}

export const DetailPageSkeleton: React.FC<DetailPageSkeletonProps> = ({
  showImage = true,
  showTitle = true,
  showSubtitle = true,
  contentLineCount = 4,
}) => {
  return (
    <View style={styles.detailContainer}>
      {showImage && (
        <SkeletonLine
          width="100%"
          height={200}
          borderRadius={12}
          marginBottom={24}
        />
      )}

      {showTitle && (
        <SkeletonLine
          width="80%"
          height={24}
          borderRadius={8}
          marginBottom={16}
        />
      )}

      {showSubtitle && (
        <SkeletonLine
          width="60%"
          height={14}
          borderRadius={6}
          marginBottom={24}
        />
      )}

      <View style={styles.contentSection}>
        {Array.from({ length: contentLineCount }).map((_, i) => (
          <SkeletonLine
            key={i}
            width={i === contentLineCount - 1 ? '70%' : '100%'}
            height={14}
            borderRadius={6}
            marginBottom={i === contentLineCount - 1 ? 0 : 12}
          />
        ))}
      </View>
    </View>
  );
};

interface ListSkeletonProps {
  itemCount?: number;
  itemHeight?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  itemCount = 5,
  itemHeight = 80,
}) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: itemCount }).map((_, i) => (
        <CardSkeleton
          key={i}
          height={itemHeight}
          showHeader={true}
          lineCount={2}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.surface,
  },
  cardContainer: {
    backgroundColor: theme.surfaceLight,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  headerSection: {
    marginBottom: theme.spacing.lg,
  },
  contentSection: {
    marginTop: theme.spacing.md,
  },
  detailContainer: {
    padding: theme.spacing.lg,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
});
