import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, AccessibilityInfo, AccessibilityRole } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

export type AchievementType =
  | 'first_ritual'
  | 'five_rituals'
  | 'fifty_rituals'
  | 'hundred_rituals'
  | 'perfect_week'
  | 'perfect_month'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'manifestation_unlocked'
  | 'first_journal'
  | 'first_manifestation';

export interface Achievement {
  id: AchievementType;
  title: string;
  description: string;
  icon: string;
  gradientColors: [string, string];
  unlockedAt?: string;
  isUnlocked: boolean;
}

export const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, Omit<Achievement, 'isUnlocked' | 'unlockedAt'>> = {
  first_ritual: {
    id: 'first_ritual',
    title: 'First Step',
    description: 'Complete your first ritual',
    icon: 'favorite',
    gradientColors: ['#FF6B9D', '#C06C84'],
  },
  five_rituals: {
    id: 'five_rituals',
    title: 'Rising Practitioner',
    description: 'Complete 5 rituals',
    icon: 'bolt',
    gradientColors: ['#FFB347', '#FF8C42'],
  },
  fifty_rituals: {
    id: 'fifty_rituals',
    title: 'Devoted Practitioner',
    description: 'Complete 50 rituals',
    icon: 'stars',
    gradientColors: ['#8B7ABE', '#6A5ACD'],
  },
  hundred_rituals: {
    id: 'hundred_rituals',
    title: 'Master Ritualist',
    description: 'Complete 100 rituals',
    icon: 'school',
    gradientColors: ['#FFD700', '#FFA500'],
  },
  perfect_week: {
    id: 'perfect_week',
    title: 'Week of Power',
    description: 'Complete all scheduled rituals in a week',
    icon: 'calendar-today',
    gradientColors: ['#20B2AA', '#48D1CC'],

  },
  perfect_month: {
    id: 'perfect_month',
    title: 'Monthly Mastery',
    description: 'Complete all scheduled rituals in a month',
    icon: 'event-available',
    gradientColors: ['#4169E1', '#1E90FF'],
  },
  streak_3: {
    id: 'streak_3',
    title: 'Consistency Spark',
    description: 'Maintain a 3-day streak',
    icon: 'local-fire-department',
    gradientColors: ['#FF4500', '#FF6347'],
  },
  streak_7: {
    id: 'streak_7',
    title: 'Week of Fire',
    description: 'Maintain a 7-day streak',
    icon: 'whatshot',
    gradientColors: ['#DC143C', '#FF0000'],
  },
  streak_30: {
    id: 'streak_30',
    title: 'Eternal Flame',
    description: 'Maintain a 30-day streak',
    icon: 'star',
    gradientColors: ['#FFD700', '#FFA500'],
  },
  manifestation_unlocked: {
    id: 'manifestation_unlocked',
    title: 'Manifestation Awakened',
    description: 'Manifest your first intention',
    icon: 'light-mode',
    gradientColors: ['#FFE135', '#FFC700'],
  },
  first_journal: {
    id: 'first_journal',
    title: 'Keeper of Memories',
    description: 'Write your first journal entry',
    icon: 'library-books',
    gradientColors: ['#9370DB', '#8A2BE2'],
  },
  first_manifestation: {
    id: 'first_manifestation',
    title: 'Reality Shifter',
    description: 'Experience your first manifestation result',
    icon: 'auto-awesome',
    gradientColors: ['#FF1493', '#FF69B4'],
  },
};

interface BadgeProps {
  achievement: Achievement;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  animateIn?: boolean;
  showLabel?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  achievement,
  onPress,
  size = 'medium',
  animateIn = false,
  showLabel = true,
}) => {
  const [scaleAnim] = useState(new Animated.Value(animateIn ? 0 : 1));
  const [opacityAnim] = useState(new Animated.Value(animateIn ? 0 : 1));

  useEffect(() => {
    if (animateIn && achievement.isUnlocked) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 40,
          friction: 5,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animateIn, achievement.isUnlocked]);

  const sizeStyles = {
    small: { width: 60, height: 60, iconSize: 28, textSize: 10 },
    medium: { width: 80, height: 80, iconSize: 36, textSize: 12 },
    large: { width: 120, height: 120, iconSize: 48, textSize: 14 },
  };

  const currentSize = sizeStyles[size];

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  const badge = (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Animated.View
        style={[
          animatedStyle,
          {
            width: currentSize.width,
            height: currentSize.height,
            borderRadius: currentSize.width / 2,
            overflow: 'hidden',
          },
        ]}
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel={`${achievement.title} achievement${achievement.isUnlocked ? ' unlocked' : ' locked'}`}
      >
        <LinearGradient
          colors={achievement.isUnlocked ? achievement.gradientColors : ['#999999', '#666666']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: achievement.isUnlocked ? 2 : 0,
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
            ]}
          >
            <MaterialIcons
              name={achievement.icon as any}
              size={currentSize.iconSize}
              color="white"
            />
            {!achievement.isUnlocked && (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  },
                ]}
              >
                <MaterialIcons name="lock" size={currentSize.iconSize * 0.6} color="white" />
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {showLabel && (
        <View style={{ alignItems: 'center', maxWidth: currentSize.width + 20 }}>
          <Text
            style={[
              styles.badgeTitle,
              {
                fontSize: currentSize.textSize,
                color: achievement.isUnlocked ? theme.colors.text : '#999',
                fontWeight: '600',
              },
            ]}
            numberOfLines={1}
          >
            {achievement.title}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress && achievement.isUnlocked) {
    return (
      <Pressable
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${achievement.title}: ${achievement.description}`}
        accessibilityHint="Double tap to view details"
      >
        {badge}
      </Pressable>
    );
  }

  return badge;
};

const styles = StyleSheet.create({
  badgeTitle: {
    color: theme.colors.text,
    fontWeight: '600',
  },
});

export default Badge;
