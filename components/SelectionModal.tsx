import React from 'react';
import {
  View, ScrollView, Pressable, Text, StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ModalBase, { ModalAction } from './ModalBase';
import { theme } from '../constants/theme';

export interface SelectionItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
}

interface SelectionModalProps {
  visible: boolean;
  title: string;
  items: SelectionItem[];
  selectedIds?: string[];
  onSelect: (item: SelectionItem, isSelected: boolean) => void;
  onClose: () => void;
  multiSelect?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  maxHeight?: number;
}

/**
 * Consolidated selection modal component
 * Replaces scattered selection/list modals across screens
 * Supports both single and multi-select modes
 * Used for: Category selection, library item selection, etc.
 */
export default function SelectionModal({
  visible,
  title,
  items,
  selectedIds = [],
  onSelect,
  onClose,
  multiSelect = false,
  confirmLabel = 'Done',
  cancelLabel = 'Cancel',
  maxHeight = 400,
}: SelectionModalProps) {
  const actions: ModalAction[] = [
    {
      label: cancelLabel,
      onPress: onClose,
      variant: 'secondary',
    },
    {
      label: confirmLabel,
      onPress: onClose,
      variant: 'primary',
    },
  ];

  const handleItemPress = (item: SelectionItem) => {
    const isSelected = selectedIds.includes(item.id);
    onSelect(item, !isSelected);
    Haptics.selectionAsync();

    // For single-select, close immediately
    if (!multiSelect && !isSelected) {
      setTimeout(() => onClose(), 200);
    }
  };

  return (
    <ModalBase
      visible={visible}
      title={title}
      showClose={true}
      onClose={onClose}
      actions={!multiSelect ? undefined : actions}
      closeOnOverlayPress={true}
      position="center"
    >
      <ScrollView
        style={{ maxHeight }}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id);

          return (
            <Pressable
              key={item.id}
              style={[
                styles.selectionItem,
                isSelected && styles.selectionItemActive,
              ]}
              onPress={() => handleItemPress(item)}
            >
              {item.icon && (
                <MaterialIcons
                  name={item.icon as keyof typeof MaterialIcons.glyphMap}
                  size={20}
                  color={isSelected ? theme.primary : theme.textSecondary}
                  style={styles.itemIcon}
                />
              )}

              <View style={styles.itemContent}>
                <Text
                  style={[
                    styles.itemLabel,
                    isSelected && styles.itemLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
                {item.description && (
                  <Text style={styles.itemDescription}>
                    {item.description}
                  </Text>
                )}
              </View>

              {(multiSelect || isSelected) && (
                <MaterialIcons
                  name={multiSelect ? 'check-circle' : 'radio-button-checked'}
                  size={20}
                  color={isSelected ? theme.primary : theme.textMuted}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </ModalBase>
  );
}

const styles = StyleSheet.create({
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border + '40',
    gap: 12,
  },
  selectionItemActive: {
    backgroundColor: theme.primary + '08',
  },
  itemIcon: {
    width: 24,
    height: 24,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  itemLabelActive: {
    fontWeight: '600',
    color: theme.primary,
  },
  itemDescription: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
