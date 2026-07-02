import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { Achievement } from './AchievementBadge';

interface AchievementUnlockedToastProps {
  achievement: Achievement | null;
  onDismiss?: () => void;
  duration?: number;
}

/**
 * Toast component for displaying newly unlocked achievements
 */
const AchievementUnlockedToast: React.FC<AchievementUnlockedToastProps> = ({
  achievement,
  onDismiss,
  duration = 5000,
}) => {
  const [translateY] = useState(new Animated.Value(100));
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!achievement) return;

    // Slide in animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 400,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss?.();
      });
    }, duration);

    // Announce achievement for accessibility
    AccessibilityInfo.announceForAccessibility(
      `Achievement unlocked: ${achievement.title}. ${achievement.description}`
    ).catch(err => console.warn('Accessibility announcement failed:', err));

    return () => clearTimeout(timer);
  }, [achievement, duration, onDismiss, translateY, opacity]);

  if (!achievement) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`New achievement unlocked: ${achievement.title}`}
    >
      <LinearGradient
        colors={achievement.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialIcons name={achievement.icon as any} size={32} color="white" />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>Achievement Unlocked!</Text>
            <Text style={styles.achievementName} numberOfLines={1}>
              {achievement.title}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {achievement.description}
            </Text>
          </View>

          <View style={styles.sparkles}>
            <MaterialIcons name="stars" size={24} color="white" />
          </View>
        </View>

        {/* Progress bar animation */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: opacity.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: ['0%', '100%', '0%'],
                }),
              },
            ]}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  achievementName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  sparkles: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 12,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 1,
  },
});

export default AchievementUnlockedToast;
