import React, { useState } from 'react';
import {
  View, Text, Modal, StyleSheet, Pressable, ScrollView, TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';

interface ColorPickerModalProps {
  visible: boolean;
  initialColor?: string;
  itemName: string;
  itemType: 'category' | 'deity';
  onSelect: (color: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: 'Lavender Purple', hex: '#C9A0DC' },
  { name: 'Deep Purple', hex: '#9B6DB5' },
  { name: 'Soft Lavender', hex: '#B8B0E8' },
  { name: 'Light Lavender', hex: '#DFC4EB' },
  { name: 'Rose Gold', hex: '#D4A8C4' },
  { name: 'Dusty Rose', hex: '#C87A8A' },
  { name: 'Blush Pink', hex: '#F5D5E0' },
  { name: 'Money Green', hex: '#5EBD8A' },
  { name: 'Love Red', hex: '#E85D6F' },
  { name: 'Gold', hex: '#C9A84C' },
  { name: 'Protection Violet', hex: '#7C5CBF' },
  { name: 'Ocean Blue', hex: '#4A9FBE' },
  { name: 'Forest Green', hex: '#2D5A4F' },
  { name: 'Autumn Orange', hex: '#D87A3A' },
  { name: 'Twilight Blue', hex: '#6B5B9E' },
  { name: 'Moonstone', hex: '#A8B8D8' },
];

export default function ColorPickerModal({
  visible,
  initialColor = theme.primary,
  itemName,
  itemType,
  onSelect,
  onClose,
}: ColorPickerModalProps) {
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [customHex, setCustomHex] = useState(initialColor);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    setCustomHex(color);
    Haptics.selectionAsync();
  };

  const handleCustomColor = (hex: string) => {
    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setCustomHex(hex);
      setSelectedColor(hex);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedColor);
    onClose();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.textPrimary} />
            </Pressable>
            <View style={styles.headerTitle}>
              <Text style={styles.title}>
                {itemType === 'category' ? 'Category Color' : 'Deity Color'}
              </Text>
              <Text style={styles.subtitle}>{itemName}</Text>
            </View>
            <View style={{ width: 32 }} />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Preview Box */}
          <View style={styles.previewSection}>
            <Text style={styles.sectionLabel}>Preview</Text>
            <View
              style={[
                styles.previewBox,
                { backgroundColor: selectedColor },
              ]}
            >
              <Text style={styles.previewText}>
                {itemType === 'category' ? 'Category' : 'Deity'}
              </Text>
              <Text style={styles.previewSubtext}>{itemName}</Text>
            </View>
            <Text style={styles.hexCode}>{selectedColor}</Text>
          </View>

          {/* Preset Colors */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Preset Palette</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((color) => (
                <Pressable
                  key={color.hex}
                  style={[
                    styles.colorOption,
                    selectedColor === color.hex && styles.selectedColor,
                  ]}
                  onPress={() => handleSelectColor(color.hex)}
                >
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color.hex },
                      selectedColor === color.hex && styles.selectedSwatch,
                    ]}
                  >
                    {selectedColor === color.hex && (
                      <MaterialIcons name="check" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={styles.colorLabel}>{color.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Custom Color Input */}
          <View style={styles.section}>
            <Pressable
              style={styles.customButton}
              onPress={() => {
                setShowCustomInput(!showCustomInput);
                Haptics.selectionAsync();
              }}
            >
              <MaterialIcons name="palette" size={20} color={theme.primary} />
              <Text style={styles.customButtonText}>Custom Color</Text>
              <MaterialIcons
                name={showCustomInput ? 'expand-less' : 'expand-more'}
                size={20}
                color={theme.primary}
              />
            </Pressable>

            {showCustomInput && (
              <View style={styles.customInputContainer}>
                <Text style={styles.inputLabel}>Enter HEX Code</Text>
                <View style={styles.hexInputWrapper}>
                  <Text style={styles.hashSymbol}>#</Text>
                  <TextInput
                    style={styles.hexInput}
                    placeholder="C9A0DC"
                    placeholderTextColor={theme.textMuted}
                    value={customHex.replace('#', '')}
                    onChangeText={(text) =>
                      handleCustomColor(text ? `#${text}` : theme.primary)
                    }
                    maxLength={6}
                    autoCapitalize="characters"
                  />
                </View>
                <Text style={styles.hint}>Format: RRGGBB (6 hex digits)</Text>
              </View>
            )}
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={16} color={theme.primary} />
            <Text style={styles.infoText}>
              Choose a color that resonates with your {itemType === 'category' ? 'practice' : 'spiritual'} intention. This color will help you quickly identify and organize your {itemType === 'category' ? 'rituals' : 'divine connections'}.
            </Text>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.confirmButton]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>Use This Color</Text>
            <MaterialIcons name="check" size={18} color={theme.background} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 20,
  },
  previewSection: {
    alignItems: 'center',
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    alignSelf: 'flex-start',
  },
  previewBox: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    opacity: 0.8,
  },
  previewSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  hexCode: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 1,
    fontFamily: 'Courier',
  },
  section: {
    gap: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: '33.33%',
    alignItems: 'center',
    gap: 8,
  },
  selectedColor: {
    opacity: 1,
  },
  colorSwatch: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSwatch: {
    borderColor: theme.primary,
    borderWidth: 3,
  },
  colorLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.primary + '45',
  },
  customButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginLeft: 10,
  },
  customInputContainer: {
    gap: 10,
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hexInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.primary + '30',
    paddingHorizontal: 12,
  },
  hashSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.primary,
  },
  hexInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'Courier',
  },
  hint: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: theme.primary + '12',
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
    borderRadius: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: theme.primary + '45',
    backgroundColor: theme.primary + '12',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.primary,
  },
  confirmButton: {
    backgroundColor: theme.primary,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.background,
  },
});
