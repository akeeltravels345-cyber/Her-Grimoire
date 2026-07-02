import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, StyleSheet, Pressable, Animated, TextInput, ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const REFLECTION_PROMPTS = [
  'What surprised you about how this manifested?',
  'Which sign did you trust the most?',
  'What will you call in next?',
  'What did you learn about yourself?',
  'How did you know it was working?',
  'What was the key moment?',
];

const CONFETTI_EMOJIS = ['✨', '⭐', '🌟', '💫', '✦', '🎆', '🎇', '🌠'];

// Animated Confetti Piece Component
function AnimatedConfetti({ index, visible }: { index: number; visible: boolean }) {
  const animValue = React.useRef(new Animated.Value(0)).current;
  const rotationValue = React.useRef(new Animated.Value(0)).current;
  const horizontalValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const duration = 2500 + (index % 3) * 500; // Stagger the animations
      const startDelay = index * 30; // Slight delay for each piece

      Animated.parallel([
        // Fall animation
        Animated.timing(animValue, {
          toValue: 1,
          duration,
          useNativeDriver: true,
          delay: startDelay,
        }),
        // Rotation
        Animated.timing(rotationValue, {
          toValue: 360 + (Math.random() * 360),
          duration,
          useNativeDriver: true,
          delay: startDelay,
        }),
        // Horizontal drift
        Animated.timing(horizontalValue, {
          toValue: (Math.random() - 0.5) * 100,
          duration,
          useNativeDriver: true,
          delay: startDelay,
        }),
      ]).start();
    }
  }, [visible, index, animValue, rotationValue, horizontalValue]);

  const screenHeight = Dimensions.get('window').height;

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
      <Text style={{ fontSize: 32 }}>
        {CONFETTI_EMOJIS[index % CONFETTI_EMOJIS.length]}
      </Text>
    </Animated.View>
  );
}

interface CelebrationModalProps {
  visible: boolean;
  ritualName: string;
  daysActive: number;
  signsLogged: number;
  onClose: () => void;
  onReflection?: (reflection: string) => void;
  onUndo?: () => void;
}

export default function CelebrationModal({
  visible,
  ritualName,
  daysActive,
  signsLogged,
  onClose,
  onReflection,
  onUndo,
}: CelebrationModalProps) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const [reflection, setReflection] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);
  const [showReflection, setShowReflection] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(5);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
      setUndoCountdown(5);
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  // Countdown timer for undo button
  useEffect(() => {
    if (!visible || undoCountdown <= 0) return;
    const timer = setTimeout(() => setUndoCountdown(undoCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [visible, undoCountdown]);

  const handleClose = () => {
    setReflection('');
    setShowReflection(false);
    setPromptIndex(0);
    onClose();
  };

  // Format days grammar
  const daysText = daysActive === 1 ? '1 day' : `${daysActive} days`;
  const signsText = signsLogged === 1 ? '1 sign' : `${signsLogged} signs`;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Animated Confetti Background */}
        <View style={styles.confettiLayer}>
          {Array.from({ length: 16 }).map((_, i) => (
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
          {/* Scroll for long content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Celebration Emoji - LARGER */}
            <Text style={styles.celebrationEmoji}>✨</Text>

            {/* Title - BOLDER, LARGER */}
            <Text style={styles.title}>Your Wish Manifested!</Text>
            <Text style={styles.subtitle}>into Reality</Text>

            {/* Stats - BETTER SPACING */}
            <View style={styles.statsContainer}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{daysActive}</Text>
                <Text style={styles.statLabel}>Days</Text>
                <Text style={styles.statDesc}>from intention to magic</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{signsLogged}</Text>
                <Text style={styles.statLabel}>Signs</Text>
                <Text style={styles.statDesc}>you noticed</Text>
              </View>
            </View>

            {/* Ritual Card - BETTER STYLING */}
            <View style={styles.ritualCard}>
              <Text style={styles.ritualLabel}>✨ SPELL CAST</Text>
              <Text style={styles.ritualName} numberOfLines={2}>
                {ritualName}
              </Text>
            </View>

            {/* Reflection Section - BETTER SPACING */}
            {!showReflection ? (
              <Pressable
                style={styles.promptCard}
                onPress={() => {
                  setShowReflection(true);
                  Haptics.selectionAsync();
                }}
              >
                <View style={styles.promptCardContent}>
                  <Text style={styles.promptLabel}>✍️ Quick Reflection</Text>
                  <Text style={styles.promptText}>
                    {REFLECTION_PROMPTS[promptIndex]}
                  </Text>
                  <View style={styles.promptHint}>
                    <MaterialIcons name="edit" size={13} color={theme.primary} />
                    <Text style={styles.promptHintText}>Tap to reflect</Text>
                  </View>
                </View>
              </Pressable>
            ) : (
              <View style={styles.reflectionInput}>
                <View style={styles.reflectionHeader}>
                  <Text style={styles.reflectionLabel}>Your Reflection</Text>
                  <Pressable
                    onPress={() => {
                      setShowReflection(false);
                      Haptics.selectionAsync();
                    }}
                  >
                    <MaterialIcons name="close" size={18} color={theme.textMuted} />
                  </Pressable>
                </View>
                <TextInput
                  style={styles.reflectionTextInput}
                  value={reflection}
                  onChangeText={setReflection}
                  placeholder={REFLECTION_PROMPTS[promptIndex]}
                  placeholderTextColor={theme.textMuted}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
                <View style={styles.reflectionActions}>
                  <Pressable
                    style={styles.nextPromptBtn}
                    onPress={() => {
                      setReflection('');
                      setPromptIndex((i) => (i + 1) % REFLECTION_PROMPTS.length);
                      Haptics.selectionAsync();
                    }}
                  >
                    <MaterialIcons name="arrow-forward" size={14} color={theme.primary} />
                    <Text style={styles.nextPromptText}>Next</Text>
                  </Pressable>
                  <Pressable
                    style={styles.doneBtn}
                    onPress={() => {
                      if (reflection.trim()) {
                        onReflection?.(reflection.trim());
                      }
                      setShowReflection(false);
                      setReflection('');
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                  >
                    <MaterialIcons name="check" size={14} color={theme.background} />
                    <Text style={styles.doneBtnText}>Done</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Undo Button - Shows for 5 seconds */}
          {undoCountdown > 0 && (
            <Pressable
              style={styles.undoBtn}
              onPress={() => {
                onUndo?.();
                setUndoCountdown(0);
                handleClose();
              }}
            >
              <MaterialIcons name="undo" size={18} color={theme.primary} />
              <Text style={styles.undoBtnText}>Undo ({undoCountdown}s)</Text>
            </Pressable>
          )}

          {/* Close Button - FULL WIDTH, BOTTOM */}
          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeBtnText}>Return to Cauldron</Text>
            <MaterialIcons name="arrow-forward" size={18} color={theme.background} />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 5, 25, 0.92)',
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
    maxWidth: 380,
    maxHeight: '85%',
    backgroundColor: theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.primary + '40',
    overflow: 'hidden',
    flexDirection: 'column',
    zIndex: 10,
    shadowColor: theme.primary,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 16,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.primary,
    textAlign: 'center',
    lineHeight: 36,
    fontFamily: theme.fonts.serif,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    fontStyle: 'italic',
    marginTop: -4,
    fontWeight: '500',
  },
  statsContainer: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: theme.background,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 0,
    borderWidth: 1,
    borderColor: theme.primary + '25',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.primary,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statDesc: {
    fontSize: 10,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: theme.primary + '20',
    marginHorizontal: 12,
  },
  ritualCard: {
    width: '100%',
    backgroundColor: theme.primary + '12',
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  ritualLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ritualName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
    lineHeight: 22,
  },
  promptCard: {
    width: '100%',
    backgroundColor: theme.primary + '10',
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  promptCardContent: {
    gap: 8,
  },
  promptLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptText: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  promptHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  promptHintText: {
    fontSize: 10,
    color: theme.primary,
    fontWeight: '700',
  },
  reflectionInput: {
    width: '100%',
    backgroundColor: theme.primary + '10',
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reflectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.primary,
    textTransform: 'uppercase',
  },
  reflectionTextInput: {
    backgroundColor: theme.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.primary + '30',
    minHeight: 90,
    lineHeight: 19,
  },
  reflectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  nextPromptBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.primary + '45',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary + '12',
    gap: 6,
  },
  nextPromptText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
  },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.background,
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.primary + '12',
    borderWidth: 1.5,
    borderColor: theme.primary + '45',
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 12,
    zIndex: 2,
  },
  undoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.primary,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: theme.primary,
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 20,
    zIndex: 2,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.background,
  },
});
