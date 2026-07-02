import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  /** Toast message text */
  message: string;
  /** Toast type (determines icon and color) */
  type: ToastType;
  /** Duration in ms before auto-dismiss (default 3000) */
  duration?: number;
  /** Optional custom icon */
  icon?: string;
  /** Called when toast is dismissed */
  onDismiss: () => void;
  /** Z-index for stacking multiple toasts */
  index?: number;
}

/**
 * Reusable toast notification component
 * Shows temporary feedback messages with auto-dismiss
 * Supports success, error, info, warning types
 * Dismissible via button or swipe
 */
export default function Toast({
  message,
  type,
  duration = 3000,
  icon,
  onDismiss,
  index = 0,
}: ToastProps) {
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, { dy }) => {
        // Only allow upward swipe
        if (dy < 0) {
          slideAnim.setValue(dy);
        }
      },
      onPanResponderRelease: (evt, { dy, vy }) => {
        // If swiped up significantly, dismiss
        if (dy < -50 || vy < -0.5) {
          Animated.timing(slideAnim, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
          }).start(onDismiss);
        } else {
          // Reset position
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start(onDismiss);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, slideAnim, onDismiss]);

  // Determine toast styling based on type
  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: theme.success || '#7ed4a8', icon: 'check-circle' };
      case 'error':
        return { backgroundColor: theme.error || '#ff6b6b', icon: 'error' };
      case 'warning':
        return { backgroundColor: '#ffb347', icon: 'warning' };
      case 'info':
      default:
        return { backgroundColor: theme.primary || '#6667AB', icon: 'info' };
    }
  };

  const toastStyle = getToastStyle();
  const displayIcon = icon || toastStyle.icon;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          bottom: 20 + index * 80, // Stack multiple toasts
        },
      ]}
      {...panResponder.panHandlers}
      role="status"
      aria-live="polite"
    >
      <View style={[styles.toast, { backgroundColor: toastStyle.backgroundColor }]}>
        <View style={styles.content}>
          <MaterialIcons name={displayIcon as any} size={20} color="#fff" />
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>

        <Pressable onPress={onDismiss} style={styles.dismissButton} accessible>
          <MaterialIcons name="close" size={18} color="#fff" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    flex: 1,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});
