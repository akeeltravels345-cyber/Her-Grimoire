import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface SimpleCalendarPickerProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

/**
 * Simple, fast calendar grid picker
 * No modals, no large lists - just a clean calendar view
 * No freezing, no performance issues
 */
export default function SimpleCalendarPicker({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
}: SimpleCalendarPickerProps) {
  const [displayMonth, setDisplayMonth] = useState(new Date(selectedDate));

  const daysInMonth = useMemo(() => {
    return new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate();
  }, [displayMonth]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1).getDay();
  }, [displayMonth]);

  const weeks = useMemo(() => {
    const days: (number | null)[] = [];
    // Add empty slots for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    // Split into weeks
    const weekArray = [];
    for (let i = 0; i < days.length; i += 7) {
      weekArray.push(days.slice(i, i + 7));
    }
    return weekArray;
  }, [daysInMonth, firstDayOfMonth]);

  const handlePrevMonth = () => {
    setDisplayMonth(
      new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setDisplayMonth(
      new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1)
    );
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);

    // Check bounds
    if (minDate && newDate < minDate) return;
    if (maxDate && newDate > maxDate) return;

    onSelectDate(newDate);
  };

  const isDateSelected = (day: number) => {
    if (!day) return false;
    const testDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    return (
      testDate.getDate() === selectedDate.getDate() &&
      testDate.getMonth() === selectedDate.getMonth() &&
      testDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isToday = (day: number) => {
    if (!day) return false;
    const today = new Date();
    const testDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    return (
      testDate.getDate() === today.getDate() &&
      testDate.getMonth() === today.getMonth() &&
      testDate.getFullYear() === today.getFullYear()
    );
  };

  const monthName = displayMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.header}>
        <Pressable onPress={handlePrevMonth} style={styles.navButton}>
          <MaterialIcons name="chevron-left" size={24} color={theme.primary} />
        </Pressable>
        <Text style={styles.monthText}>{monthName}</Text>
        <Pressable onPress={handleNextMonth} style={styles.navButton}>
          <MaterialIcons name="chevron-right" size={24} color={theme.primary} />
        </Pressable>
      </View>

      {/* Day Labels */}
      <View style={styles.dayLabelsRow}>
        {dayLabels.map((label) => (
          <View key={label} style={styles.dayLabelCell}>
            <Text style={styles.dayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => (
            <Pressable
              key={dayIndex}
              style={[
                styles.dayCell,
                day && isDateSelected(day) && styles.dayCellSelected,
                day && isToday(day) && styles.dayCellToday,
              ]}
              onPress={() => day && handleSelectDay(day)}
              disabled={!day}
            >
              <Text
                style={[
                  styles.dayText,
                  !day && styles.dayTextEmpty,
                  day && isDateSelected(day) && styles.dayTextSelected,
                ]}
              >
                {day}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
    borderRadius: theme.radius.sm,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    marginHorizontal: 2,
  },
  dayCellSelected: {
    backgroundColor: theme.primary,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: theme.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textPrimary,
  },
  dayTextEmpty: {
    color: 'transparent',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
});
