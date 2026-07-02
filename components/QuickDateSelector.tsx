import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../constants/theme';
import { formatShortDate } from '../utils/dateHelpers';

interface QuickDateSelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

/**
 * Ultra-simple horizontal date buttons
 * No crashes, no complex rendering
 * Just simple pill buttons for quick date selection
 */
export default function QuickDateSelector({
  selectedDate,
  onSelectDate,
}: QuickDateSelectorProps) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const getDateKey = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const selectedKey = getDateKey(selectedDate);

  const isSelected = (date: Date) => getDateKey(date) === selectedKey;

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.pill, isSelected(yesterday) && styles.pillActive]}
        onPress={() => onSelectDate(yesterday)}
      >
        <Text
          style={[
            styles.pillText,
            isSelected(yesterday) && styles.pillTextActive,
          ]}
        >
          Yesterday
        </Text>
      </Pressable>

      <Pressable
        style={[styles.pill, isSelected(today) && styles.pillActive]}
        onPress={() => onSelectDate(today)}
      >
        <Text
          style={[styles.pillText, isSelected(today) && styles.pillTextActive]}
        >
          Today
        </Text>
      </Pressable>

      <Pressable
        style={[styles.pill, isSelected(tomorrow) && styles.pillActive]}
        onPress={() => onSelectDate(tomorrow)}
      >
        <Text
          style={[
            styles.pillText,
            isSelected(tomorrow) && styles.pillTextActive,
          ]}
        >
          Tomorrow
        </Text>
      </Pressable>

      <Pressable
        style={[styles.pill, !isSelected(yesterday) && !isSelected(today) && !isSelected(tomorrow) && styles.pillActive]}
        onPress={() => {}} // Show current selection
      >
        <Text
          style={[
            styles.pillText,
            !isSelected(yesterday) &&
              !isSelected(today) &&
              !isSelected(tomorrow) &&
              styles.pillTextActive,
          ]}
        >
          {!isSelected(yesterday) &&
          !isSelected(today) &&
          !isSelected(tomorrow)
            ? formatShortDate(selectedDate)
            : ''}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pillActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  pillTextActive: {
    color: '#fff',
  },
});
