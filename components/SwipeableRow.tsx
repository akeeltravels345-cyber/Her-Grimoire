import React, { useState } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export default function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  // Simplified non-native version that works in Expo Go
  // Uses long-press to show delete button instead of swipe
  const [showDelete, setShowDelete] = useState(false);
  const fadeAnim = new Animated.Value(0);

  const handleShowDelete = () => {
    setShowDelete(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleDeleteConfirm = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowDelete(false);
      onDelete();
    });
  };

  const handleHideDelete = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setShowDelete(false));
  };

  return (
    <View style={styles.container}>
      {showDelete && (
        <Animated.View style={[styles.deleteAction, { opacity: fadeAnim }]}>
          <Pressable onPress={handleDeleteConfirm} style={styles.deleteButton}>
            <MaterialIcons name="delete" size={20} color="#FFF" />
          </Pressable>
          <Pressable onPress={handleHideDelete} style={styles.cancelButton}>
            <MaterialIcons name="close" size={20} color={theme.textPrimary} />
          </Pressable>
        </Animated.View>
      )}
      <Pressable
        onLongPress={handleShowDelete}
        delayLongPress={300}
        style={styles.content}
      >
        {children}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    backgroundColor: theme.background,
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
    zIndex: 10,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
