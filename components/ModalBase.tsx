import React from 'react';
import { View, Modal, ModalProps, Pressable, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

export interface ModalAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface ModalBaseProps extends Omit<ModalProps, 'children'> {
  /** Modal visibility */
  visible: boolean;
  /** Optional header title */
  title?: string;
  /** Show close button in header */
  showClose?: boolean;
  /** Called when close button is pressed */
  onClose?: () => void;
  /** Modal content */
  children?: React.ReactNode;
  /** Optional footer actions/buttons */
  actions?: ModalAction[];
  /** Whether overlay press should close modal */
  closeOnOverlayPress?: boolean;
  /** Modal position (bottom for slide, center for fade) */
  position?: 'bottom' | 'center';
  /** Max height for modal content (used for scrollable content) */
  maxHeight?: number | string;
}

/**
 * Unified modal component for consistent styling and behavior
 * Consolidates scattered Modal implementations across screens
 * Supports:
 * - Simple confirmation modals (title, message, actions)
 * - Date picker modals (header, scrollable content, no footer)
 * - Selection modals (list content with actions)
 * - Custom content modals (flexible children)
 */
export default function ModalBase({
  visible,
  title,
  showClose = true,
  onClose,
  children,
  actions,
  closeOnOverlayPress = true,
  position = 'center',
  maxHeight,
  animationType = 'fade',
  transparent = true,
  ...props
}: ModalBaseProps) {
  const handleOverlayPress = () => {
    if (closeOnOverlayPress && onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType={animationType}
      {...props}
    >
      <Pressable
        style={[
          styles.overlay,
          position === 'bottom' && styles.bottomOverlay,
        ]}
        onPress={handleOverlayPress}
      >
        <Pressable
          style={
            maxHeight
              ? [
                  styles.content,
                  position === 'bottom' && styles.bottomContent,
                  { maxHeight } as any,
                ]
              : [
                  styles.content,
                  position === 'bottom' && styles.bottomContent,
                ]
          }
          onPress={() => {}} // Prevent closing when pressing content
        >
          {/* Header */}
          {(title || showClose) && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {showClose && onClose && (
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <MaterialIcons
                    name="close"
                    size={24}
                    color={theme.textPrimary}
                  />
                </Pressable>
              )}
            </View>
          )}

          {/* Content */}
          <View style={styles.body}>
            {children}
          </View>

          {/* Actions/Footer */}
          {actions && actions.length > 0 && (
            <View style={styles.footer}>
              {actions.map((action, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.actionButton,
                    action.variant === 'primary' && styles.actionButtonPrimary,
                    action.variant === 'secondary' && styles.actionButtonSecondary,
                    action.variant === 'danger' && styles.actionButtonDanger,
                  ]}
                  onPress={action.onPress}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      action.variant === 'primary' && styles.actionButtonTextPrimary,
                      action.variant === 'secondary' && styles.actionButtonTextSecondary,
                      action.variant === 'danger' && styles.actionButtonTextDanger,
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  bottomOverlay: {
    justifyContent: 'flex-end',
    padding: 0,
  },
  content: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    maxWidth: 400,
    width: '100%',
    ...theme.shadows.card,
  },
  bottomContent: {
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxWidth: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.textPrimary,
    flex: 1,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    backgroundColor: theme.surfaceLight,
  },
  actionButtonPrimary: {
    backgroundColor: theme.primary,
  },
  actionButtonSecondary: {
    backgroundColor: theme.surfaceLight,
  },
  actionButtonDanger: {
    backgroundColor: theme.error,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  actionButtonTextPrimary: {
    color: theme.background,
  },
  actionButtonTextSecondary: {
    color: theme.textSecondary,
  },
  actionButtonTextDanger: {
    color: theme.background,
  },
});
