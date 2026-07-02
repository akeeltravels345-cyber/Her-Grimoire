import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import ImageUploadButton from './ImageUploadButton';
import ImageDisplay from './ImageDisplay';

interface ImageFieldProps {
  /** Current image URI */
  imageUrl?: string;
  /** Called when image is selected */
  onImageChange: (imageUri: string | undefined) => void;
  /** Label for the upload button (string or function that returns string based on whether image exists) */
  uploadLabel?: string | ((hasImage: boolean) => string);
  /** Whether to show camera option */
  showCameraOption?: boolean;
  /** Optional label for the field */
  fieldLabel?: string;
  /** Optional hint text */
  hint?: string;
  /** Size of the preview image */
  previewSize?: number;
  /** Called on upload error */
  onError?: (error: string) => void;
}

/**
 * Consolidated image field component
 * Combines ImageUploadButton + ImageDisplay + remove button
 * Eliminates duplicate image handling logic across screens
 * Used in: add-ritual, log-ritual, add-manifestation, library editing, etc.
 */
export default function ImageField({
  imageUrl,
  onImageChange,
  uploadLabel = 'Add Photo',
  showCameraOption = true,
  fieldLabel,
  hint,
  previewSize = 200,
  onError,
}: ImageFieldProps) {
  // Resolve upload label - can be a string or function
  const resolvedLabel = typeof uploadLabel === 'function'
    ? uploadLabel(!!imageUrl)
    : uploadLabel;

  return (
    <View style={styles.container}>
      {fieldLabel && <Text style={styles.label}>{fieldLabel}</Text>}
      {hint && <Text style={styles.hint}>{hint}</Text>}

      {imageUrl ? (
        <View style={styles.previewSection}>
          <ImageDisplay imageUri={imageUrl} size={previewSize} />
          <Pressable
            style={styles.removeButton}
            onPress={() => onImageChange(undefined)}
          >
            <MaterialIcons name="close" size={16} color={theme.error} />
            <Text style={styles.removeText}>Remove Image</Text>
          </Pressable>
        </View>
      ) : (
        <ImageUploadButton
          onImageSelect={onImageChange}
          label={resolvedLabel}
          showCameraOption={showCameraOption}
          onError={onError}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  previewSection: {
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.error + '15',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.error + '30',
  },
  removeText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.error,
  },
});
