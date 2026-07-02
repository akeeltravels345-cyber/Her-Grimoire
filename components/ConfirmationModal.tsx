import React from 'react';
import { Text, StyleSheet } from 'react-native';
import ModalBase, { ModalAction } from './ModalBase';
import { theme } from '../constants/theme';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
  closeOnOverlayPress?: boolean;
}

/**
 * Simple confirmation modal component
 * Replaces scattered confirmation logic with unified styling
 * Used for: Delete confirmations, action confirmations, etc.
 */
export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = false,
  closeOnOverlayPress = true,
}: ConfirmationModalProps) {
  const actions: ModalAction[] = [
    {
      label: cancelLabel,
      onPress: onCancel,
      variant: 'secondary',
    },
    {
      label: confirmLabel,
      onPress: onConfirm,
      variant: isDangerous ? 'danger' : 'primary',
    },
  ];

  return (
    <ModalBase
      visible={visible}
      title={title}
      showClose={false}
      onClose={onCancel}
      actions={actions}
      closeOnOverlayPress={closeOnOverlayPress}
      position="center"
    >
      <Text style={styles.message}>{message}</Text>
    </ModalBase>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
    marginTop: 4,
  },
});
