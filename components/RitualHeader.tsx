/**
 * RitualHeader Component
 * Displays ritual header with categories, deities, and name (edit or view mode)
 * Extracted from ritual/[id].tsx for reusability and cleaner code
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { PracticeCategory } from '../constants/config';
import { resolveCategoryColor, resolveCategory } from '../utils/categoryHelpers';
import { Ritual } from '../services/mockData';

interface RitualHeaderProps {
  ritual: Ritual;
  isEditing: boolean;
  editName: string;
  editCategories: string[];
  editDeities: string[];
  categories: PracticeCategory[];
  categoryColors: Record<string, string>;
  deities: PracticeCategory[];
  deityColors: Record<string, string>;
  catColor: string;
  onEditName: (name: string) => void;
  onEditCategories: (categories: string[]) => void;
  onEditDeities: (deities: string[]) => void;
}

export const RitualHeader: React.FC<RitualHeaderProps> = ({
  ritual,
  isEditing,
  editName,
  editCategories,
  editDeities,
  categories,
  categoryColors,
  deities,
  deityColors,
  catColor,
  onEditName,
  onEditCategories,
  onEditDeities,
}) => {
  const router = useRouter();

  // Handle both legacy (category) and new (categories) formats
  const categoryIds = ritual.categories && ritual.categories.length > 0
    ? ritual.categories
    : (ritual.category ? [ritual.category] : []);
  const primaryCategoryId = categoryIds[0];
  const category = resolveCategory(primaryCategoryId, categories);
  const allCategories = categoryIds.map(cid => resolveCategory(cid, categories)).filter(Boolean);

  if (isEditing) {
    return (
      <View style={styles.header}>
        {/* Category Picker - Multi-select */}
        <View style={styles.editCatHeader}>
          <Text style={styles.editFieldLabel}>Categories (min 1, max 3)</Text>
          {editCategories.length > 0 && (
            <Text style={styles.editCatCounter}>{editCategories.length} of 3</Text>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.editCatScroll} contentContainerStyle={styles.editCatRow}>
          {categories.map(cat => {
            const cColor = categoryColors[cat.id] || theme.accent;
            const isSelected = editCategories.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                style={[
                  styles.editCatChip,
                  isSelected && { backgroundColor: cColor + '20', borderColor: cColor },
                  editCategories.length >= 3 && !isSelected && { opacity: 0.5 }
                ]}
                onPress={() => {
                  if (isSelected) {
                    if (editCategories.length > 1) {
                      onEditCategories(editCategories.filter(c => c !== cat.id));
                      Haptics.selectionAsync();
                    }
                  } else if (editCategories.length < 3) {
                    onEditCategories([...editCategories, cat.id]);
                    Haptics.selectionAsync();
                  }
                }}
              >
                <View style={styles.editCatIconWrapper}>
                  <MaterialIcons name={cat.icon as keyof typeof MaterialIcons.glyphMap} size={18} color={isSelected ? cColor : theme.textMuted} />
                  {isSelected && (
                    <View style={[styles.editCatCheck, { backgroundColor: cColor }]}>
                      <MaterialIcons name="check" size={10} color="white" />
                    </View>
                  )}
                </View>
                <Text style={[styles.editCatChipText, isSelected && { color: cColor }]}>{cat.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Deities Picker - Multi-select */}
        <View style={styles.editCatHeader}>
          <Text style={styles.editFieldLabel}>Deities & Spiritual Beings (optional)</Text>
          {editDeities.length > 0 && (
            <Text style={styles.editCatCounter}>{editDeities.length} selected</Text>
          )}
        </View>
        <View style={styles.categoryGrid}>
          {deities.map(deity => {
            const dColor = deityColors[deity.id] || theme.accent;
            const isSelected = editDeities.includes(deity.id);
            return (
              <Pressable
                key={deity.id}
                style={[
                  styles.categoryOption,
                  isSelected && { backgroundColor: dColor + '20', borderColor: dColor }
                ]}
                onPress={() => {
                  if (isSelected) {
                    onEditDeities(editDeities.filter(d => d !== deity.id));
                  } else {
                    onEditDeities([...editDeities, deity.id]);
                  }
                  Haptics.selectionAsync();
                }}
              >
                <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name={deity.icon as keyof typeof MaterialIcons.glyphMap} size={22} color={isSelected ? dColor : theme.textMuted} />
                  {isSelected && (
                    <View style={{ position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: dColor, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialIcons name="check" size={10} color="white" />
                    </View>
                  )}
                </View>
                <Text style={[styles.categoryOptionText, isSelected && { color: dColor }]}>{deity.name}</Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.newCategoryOption} onPress={() => router.push('/manage-deities')}>
            <MaterialIcons name="add" size={22} color={theme.textMuted} />
            <Text style={styles.newCategoryOptionText}>New</Text>
          </Pressable>
        </View>

        {/* Name */}
        <Text style={styles.editFieldLabel}>Ritual Name</Text>
        <TextInput style={styles.editInput} value={editName} onChangeText={onEditName} placeholder="Ritual name..." placeholderTextColor={theme.textMuted} />
      </View>
    );
  }

  // View mode
  return (
    <View style={styles.header}>
      <View style={[styles.categoryRing, { borderColor: catColor + '50' }]}>
        <View style={[styles.categoryBadge, { backgroundColor: catColor + '20' }]}>
          <MaterialIcons name={(category?.icon || 'auto-fix-high') as keyof typeof MaterialIcons.glyphMap} size={32} color={catColor} />
        </View>
      </View>
      <Text style={styles.ritualName}>{ritual.name}</Text>
      <View style={styles.nameSeparator}>
        <View style={[styles.nameSeparatorLine, { backgroundColor: catColor + '50' }]} />
        <MaterialIcons name="auto-awesome" size={11} color={catColor} style={{ marginHorizontal: 8 }} />
        <View style={[styles.nameSeparatorLine, { backgroundColor: catColor + '50' }]} />
      </View>
      <View style={styles.tagRow}>
        {/* Display all categories */}
        {allCategories.map((cat, idx) => {
          const catColorForTag = resolveCategoryColor(categoryIds[idx], categoryColors, categories);
          return (
            <View key={categoryIds[idx]} style={[styles.tag, { backgroundColor: catColorForTag + '20' }]}>
              <Text style={[styles.tagText, { color: catColorForTag }]}>{cat?.name || categoryIds[idx]}</Text>
            </View>
          );
        })}
        {/* Display deities if any */}
        {ritual.deities && ritual.deities.length > 0 && ritual.deities.map(deityId => {
          const deity = deities.find(d => d.id === deityId);
          const dColor = deityColors[deityId] || theme.accent;
          return (
            <View key={deityId} style={[styles.tag, { backgroundColor: dColor + '20' }]}>
              <Text style={[styles.tagText, { color: dColor }]}>{deity?.name || deityId}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  categoryRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ritualName: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: theme.fonts.serif,
  },
  nameSeparator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  nameSeparatorLine: {
    flex: 1,
    height: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  editCatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  editCatCounter: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
  },
  editCatScroll: {
    marginBottom: 12,
  },
  editCatRow: {
    gap: 8,
    paddingVertical: 4,
  },
  editCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  editCatChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textMuted,
  },
  editCatIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCatCheck: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryOption: {
    width: '47%',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    alignItems: 'center',
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textMuted,
  },
  newCategoryOption: {
    width: '47%',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    alignItems: 'center',
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderStyle: 'dashed',
  },
  newCategoryOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textMuted,
  },
  editInput: {
    width: '100%',
    backgroundColor: theme.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    fontSize: 15,
    color: theme.textPrimary,
    borderWidth: 1.5,
    borderColor: theme.border,
    marginTop: 8,
  },
});
