import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface ImageDisplayProps {
  imageUri: string;
  onRemove?: () => void;
  size?: number;
}

export default function ImageDisplay({
  imageUri,
  onRemove,
  size = 120,
}: ImageDisplayProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri: imageUri }}
        style={[styles.image, { width: size, height: size }]}
        contentFit="cover"
      />
      {onRemove && (
        <Pressable
          style={styles.removeButton}
          onPress={onRemove}
        >
          <MaterialIcons name="close" size={16} color={theme.background} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
  },
  image: {
    flex: 1,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
