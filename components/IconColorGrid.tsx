import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface IconColorGridProps {
  /** Available icons to choose from */
  icons: string[];
  /** Available colors to choose from */
  colors: string[];
  /** Currently selected icon */
  selectedIcon: string;
  /** Currently selected color */
  selectedColor: string;
  /** Called when icon is selected */
  onIconChange: (icon: string) => void;
  /** Called when color is selected */
  onColorChange: (color: string) => void;
}

/**
 * Reusable icon and color grid selector component
 * Used in manage-categories and manage-deities screens
 */
export default function IconColorGrid({
  icons,
  colors,
  selectedIcon,
  selectedColor,
  onIconChange,
  onColorChange,
}: IconColorGridProps) {
  return (
    <>
      <Text style={styles.formLabel}>Icon</Text>
      <View style={styles.iconGrid}>
        {icons.map(icon => (
          <Pressable
            key={icon}
            style={[styles.iconOption, selectedIcon === icon && styles.iconOptionActive]}
            onPress={() => onIconChange(icon)}
          >
            <MaterialIcons
              name={icon as keyof typeof MaterialIcons.glyphMap}
              size={22}
              color={selectedIcon === icon ? theme.primary : theme.textMuted}
            />
          </Pressable>
        ))}
      </View>

      <Text style={styles.formLabel}>Color</Text>
      <View style={styles.colorGrid}>
        {colors.map(color => (
          <Pressable
            key={color}
            style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && styles.colorOptionActive]}
            onPress={() => onColorChange(color)}
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  formLabel: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  iconOptionActive: { borderColor: theme.primary, backgroundColor: theme.primary + '15' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorOption: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  colorOptionActive: { borderColor: '#FFF', transform: [{ scale: 1.15 }] },
});
