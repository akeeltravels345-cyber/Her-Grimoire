import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { formatDateWithDayAndYear } from '../utils/dateHelpers';

interface SimpleDatePickerProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

/**
 * Ultra-simple date picker with just +/- buttons
 * No calendar grid, no complex rendering
 * Super fast and reliable
 */
export default function SimpleDatePicker({
  selectedDate,
  onSelectDate,
}: SimpleDatePickerProps) {
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onSelectDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onSelectDate(newDate);
  };

  const handleToday = () => {
    onSelectDate(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Date</Text>

      <View style={styles.dateDisplay}>
        <Pressable onPress={handlePrevDay} style={styles.navButton} hitSlop={12}>
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>

        <View style={styles.dateTextContainer}>
          <Text style={styles.dateText}>{formatDateWithDayAndYear(selectedDate)}</Text>
          {isToday && <Text style={styles.todayBadge}>Today</Text>}
        </View>

        <Pressable onPress={handleNextDay} style={styles.navButton} hitSlop={12}>
          <MaterialIcons name="chevron-right" size={28} color={theme.primary} />
        </Pressable>
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.quickButton} onPress={handlePrevDay}>
          <MaterialIcons name="remove" size={18} color="#fff" />
          <Text style={styles.quickButtonText}>Yesterday</Text>
        </Pressable>

        <Pressable
          style={[styles.quickButton, isToday && styles.quickButtonActive]}
          onPress={handleToday}
        >
          <MaterialIcons name="today" size={18} color="#fff" />
          <Text style={styles.quickButtonText}>Today</Text>
        </Pressable>

        <Pressable style={styles.quickButton} onPress={handleNextDay}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={styles.quickButtonText}>Tomorrow</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    marginVertical: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.background,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  navButton: {
    padding: 4,
  },
  dateTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  todayBadge: {
    fontSize: 11,
    color: theme.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.primary,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
  },
  quickButtonActive: {
    backgroundColor: theme.accent,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
