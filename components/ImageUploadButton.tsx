import React from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { useImageUpload } from '../hooks/useImageUpload';

interface ImageUploadButtonProps {
  onImageSelect: (imageUri: string) => void;
  label?: string;
  showCameraOption?: boolean;
  onError?: (error: string) => void;
}

export default function ImageUploadButton({
  onImageSelect,
  label = 'Add Photo',
  showCameraOption = true,
  onError,
}: ImageUploadButtonProps) {
  const { pickImage, takePhoto, isLoading, error, clearError } = useImageUpload();
  const [showOptions, setShowOptions] = React.useState(false);

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result) {
      onImageSelect(result.uri);
      setShowOptions(false);
    }
  };

  const handleTakePhoto = async () => {
    const result = await takePhoto();
    if (result) {
      onImageSelect(result.uri);
      setShowOptions(false);
    }
  };

  const handleCancel = () => {
    setShowOptions(false);
    clearError();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={styles.loadingText}>Processing image...</Text>
      </View>
    );
  }

  if (showOptions) {
    return (
      <View style={styles.optionsContainer}>
        {error && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={16} color={theme.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <Pressable style={styles.optionButton} onPress={handlePickImage}>
          <MaterialIcons name="image" size={20} color={theme.primary} />
          <Text style={styles.optionText}>Choose Photo</Text>
        </Pressable>
        {showCameraOption && (
          <Pressable style={styles.optionButton} onPress={handleTakePhoto}>
            <MaterialIcons name="camera-alt" size={20} color={theme.primary} />
            <Text style={styles.optionText}>Take Photo</Text>
          </Pressable>
        )}
        <Pressable style={styles.optionButton} onPress={handleCancel}>
          <MaterialIcons name="close" size={20} color={theme.textSecondary} />
          <Text style={styles.optionText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      style={styles.button}
      onPress={() => {
        clearError();
        setShowOptions(true);
      }}
    >
      <MaterialIcons name="add-a-photo" size={18} color={theme.primary} />
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.primary + '40',
    backgroundColor: theme.primary + '08',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  optionsContainer: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.error + '15',
    borderBottomWidth: 1,
    borderBottomColor: theme.error + '30',
  },
  errorText: {
    fontSize: 13,
    color: theme.error,
    fontWeight: '500',
    flex: 1,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.textPrimary,
  },
});
