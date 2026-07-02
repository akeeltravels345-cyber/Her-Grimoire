import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';

export interface ImageUploadResult {
  uri: string;
  fileName: string;
  size: number;
  width: number;
  height: number;
}

const MAX_IMAGE_WIDTH = 1080;
const MAX_IMAGE_HEIGHT = 1440;
const MAX_FILE_SIZE_MB = 10; // 10MB max
const COMPRESSION_QUALITY = 0.75; // 75% quality for better compression
const GRIMOIRE_IMAGES_DIR = `${FileSystem.documentDirectory}grimoire_images/`;

async function ensureImagesDirectory(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(GRIMOIRE_IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(GRIMOIRE_IMAGES_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error creating images directory:', error);
    throw new Error('Failed to create storage directory');
  }
}

async function compressAndOptimizeImage(imageUri: string): Promise<{ uri: string; width: number; height: number }> {
  try {
    // Get original dimensions
    const originalImage = await ImageManipulator.manipulateAsync(imageUri, [], { compress: 1 });

    let width = originalImage.width;
    let height = originalImage.height;

    // Calculate resize dimensions maintaining aspect ratio
    if (width > MAX_IMAGE_WIDTH) {
      const ratio = MAX_IMAGE_WIDTH / width;
      width = MAX_IMAGE_WIDTH;
      height = Math.round(height * ratio);
    }
    if (height > MAX_IMAGE_HEIGHT) {
      const ratio = MAX_IMAGE_HEIGHT / height;
      height = MAX_IMAGE_HEIGHT;
      width = Math.round(width * ratio);
    }

    // Compress and resize
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width, height } }],
      { compress: COMPRESSION_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
}

export function useImageUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async (): Promise<ImageUploadResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Request permission
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Camera roll access denied');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return null;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        setError('Failed to get image');
        return null;
      }

      // Ensure directory exists
      await ensureImagesDirectory();

      // Compress and optimize image
      const optimized = await compressAndOptimizeImage(asset.uri);

      // Save image to app directory
      const fileName = `img_${Date.now()}.jpg`;
      const filePath = `${GRIMOIRE_IMAGES_DIR}${fileName}`;

      await FileSystem.copyAsync({
        from: optimized.uri,
        to: filePath,
      });

      // Verify file size
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const fileSizeMB = (fileInfo.size || 0) / (1024 * 1024);

      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        setError(`Image too large (${fileSizeMB.toFixed(1)}MB). Max: ${MAX_FILE_SIZE_MB}MB`);
        return null;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return {
        uri: `file://${filePath}`,
        fileName,
        size: fileInfo.size || 0,
        width: optimized.width,
        height: optimized.height,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload image';
      console.error('Error picking image:', err);
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async (): Promise<ImageUploadResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Request camera permission
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        setError('Camera access denied');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return null;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        setError('Failed to capture photo');
        return null;
      }

      // Ensure directory exists
      await ensureImagesDirectory();

      // Compress and optimize image
      const optimized = await compressAndOptimizeImage(asset.uri);

      // Save image to app directory
      const fileName = `img_${Date.now()}.jpg`;
      const filePath = `${GRIMOIRE_IMAGES_DIR}${fileName}`;

      await FileSystem.copyAsync({
        from: optimized.uri,
        to: filePath,
      });

      // Verify file size
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const fileSizeMB = (fileInfo.size || 0) / (1024 * 1024);

      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        setError(`Image too large (${fileSizeMB.toFixed(1)}MB). Max: ${MAX_FILE_SIZE_MB}MB`);
        return null;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return {
        uri: `file://${filePath}`,
        fileName,
        size: fileInfo.size || 0,
        width: optimized.width,
        height: optimized.height,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to take photo';
      console.error('Error taking photo:', err);
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (imageUri: string): Promise<boolean> => {
    try {
      // Handle file:// protocol
      const filePath = imageUri.startsWith('file://') ? imageUri.slice(7) : imageUri;
      await FileSystem.deleteAsync(filePath, { idempotent: true });
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  const deleteAndReplace = async (oldImageUri: string | undefined, newImageUri: string): Promise<void> => {
    // Delete old image if it exists
    if (oldImageUri && (oldImageUri.includes(GRIMOIRE_IMAGES_DIR) || oldImageUri.startsWith('file://'))) {
      await deleteImage(oldImageUri);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  return {
    pickImage,
    takePhoto,
    deleteImage,
    deleteAndReplace,
    isLoading,
    error,
    clearError,
  };
}
