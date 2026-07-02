import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, StyleSheet, Pressable, Animated, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

// Confetti animation component
function AnimatedConfetti({ index, visible }: { index: number; visible: boolean }) {
  const animValue = React.useRef(new Animated.Value(0)).current;
  const rotationValue = React.useRef(new Animated.Value(0)).current;
  const horizontalValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const duration = 3000 + (index % 3) * 500;
      const startDelay = index * 40;

      Animated.parallel([
        Animated.timing(animValue, {
          toValue: 1,
          duration,
          useNativeDriver: true,
          delay: startDelay,
        }),
        Animated.timing(rotationValue, {
          toValue: 360 + (Math.random() * 360),
          duration,
          useNativeDriver: true,
          delay: startDelay,
        }),
        Animated.timing(horizontalValue, {
          toValue: (Math.random() - 0.5) * 120,
          duration,
          useNativeDriver: true,
          delay: startDelay,
        }),
      ]).start();
    }
  }, [visible, index, animValue, rotationValue, horizontalValue]);

  const screenHeight = Dimensions.get('window').height;
  const CONFETTI_EMOJIS = ['✨', '⭐', '🌟', '💫', '✦', '🎆', '🎇', '🌠', '💜', '🔮', '✨'];

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, screenHeight],
  });

  const rotation = rotationValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: `${10 + (index % 8) * 11}%`,
          opacity,
          transform: [
            { translateY },
            { translateX: horizontalValue },
            { rotate: rotation },
          ],
        },
      ]}
    >
      <Text style={{ fontSize: 36 }}>
        {CONFETTI_EMOJIS[index % CONFETTI_EMOJIS.length]}
      </Text>
    </Animated.View>
  );
}

interface StreakerCelebrationModalProps {
  visible: boolean;
  streakDays: number;
  onClose: () => void;
  onShare?: () => void;
}

export default function StreakerCelebrationModal({
  visible,
  streakDays,
  onClose,
  onShare,
}: StreakerCelebrationModalProps) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Determine milestone type and message
  const getMilestoneInfo = (days: number) => {
    if (days >= 60) {
      return {
        emoji: '🏆',
        title: 'Legendary Streak!',
        message: 'Two months of unbroken magic',
        color: '#FFD700',
        accent: '#FFA500',
      };
    } else if (days >= 30) {
      return {
        emoji: '👑',
        title: 'Monthly Master',
        message: 'A full cycle of manifestation',
        color: '#C9A0DC',
        accent: '#E85D6F',
      };
    } else if (days >= 14) {
      return {
        emoji: '🌕',
        title: 'Fortnight Force',
        message: 'Two weeks of dedicated practice',
        color: '#DFC4EB',
        accent: '#7ED4A8',
      };
    } else if (days >= 7) {
      return {
        emoji: '🌟',
        title: 'Weekly Warrior',
        message: 'Seven days of pure intention',
        color: '#C9A0DC',
        accent: '#B8B0E8',
      };
    }
    return {
      emoji: '✨',
      title: 'Rising Practitioner',
      message: 'Building momentum daily',
      color: '#B8B0E8',
      accent: '#C9A0DC',
    };
  };

  const milestoneInfo = getMilestoneInfo(streakDays);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for the streak count
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible, scaleAnim, opacityAnim, pulseAnim]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Animated Confetti Background */}
        <View style={styles.confettiLayer}>
          {Array.from({ length: 20 }).map((_, i) => (
            <AnimatedConfetti key={i} index={i} visible={visible} />
          ))}
        </View>

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[theme.background, theme.backgroundSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Top Badge */}
            <View style={[styles.badge, { borderColor: milestoneInfo.accent }]}>
              <Text style={styles.badgeText}>STREAK MILESTONE</Text>
            </View>

            {/* Main Emoji */}
            <Text style={styles.mainEmoji}>{milestoneInfo.emoji}</Text>

            {/* Title */}
            <Text style={[styles.title, { color: milestoneInfo.color }]}>
              {milestoneInfo.title}
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              {milestoneInfo.message}
            </Text>

            {/* Streak Count with Pulse */}
            <Animated.View
              style={[
                styles.streakCountContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <View style={[styles.streakCountBg, { backgroundColor: milestoneInfo.color + '20', borderColor: milestoneInfo.color }]}>
                <Text style={[styles.streakNumber, { color: milestoneInfo.color }]}>
                  {streakDays}
                </Text>
                <Text style={styles.streakLabel}>days</Text>
              </View>
            </Animated.View>

            {/* Encouraging message based on milestone */}
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>
                {streakDays >= 60
                  ? 'Your dedication has manifested magic beyond measure. You are a force of nature.'
                  : streakDays >= 30
                    ? 'A full lunar cycle of unwavering commitment. The universe is listening.'
                    : streakDays >= 14
                      ? 'Two weeks of consistent intention-setting. The spell is taking shape.'
                      : streakDays >= 7
                        ? 'One week of pure magical practice. You are building power.'
                        : 'Every day brings you closer to your manifestation.'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={() => {
                  onShare?.();
                  Haptics.selectionAsync();
                }}
              >
                <MaterialIcons name="share" size={18} color={milestoneInfo.color} />
                <Text style={[styles.buttonText, { color: milestoneInfo.color }]}>
                  Share
                </Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.primaryButton, { backgroundColor: milestoneInfo.accent }]}
                onPress={() => {
                  onClose();
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <Text style={styles.primaryButtonText}>Keep the Streak!</Text>
                <MaterialIcons name="arrow-forward" size={18} color={theme.background} />
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 5, 25, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  confettiLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    overflow: 'hidden',
    zIndex: 10,
    shadowColor: theme.primary,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 24,
  },
  gradient: {
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 16,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.primary,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainEmoji: {
    fontSize: 72,
    marginVertical: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 40,
    fontFamily: theme.fonts.serif,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  streakCountContainer: {
    marginVertical: 8,
  },
  streakCountBg: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    gap: 4,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  messageCard: {
    backgroundColor: theme.primary + '12',
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  messageText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: theme.primary + '45',
    backgroundColor: theme.primary + '12',
  },
  primaryButton: {
    backgroundColor: theme.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.background,
  },
});
