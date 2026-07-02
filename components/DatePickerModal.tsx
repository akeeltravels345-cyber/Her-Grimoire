import React, { useMemo } from 'react';
import {
  View, FlatList, Pressable, Text, StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import ModalBase from './ModalBase';
import { theme } from '../constants/theme';
import { formatDateWithShortDay } from '../utils/dateHelpers';

interface DatePickerModalProps {
  visible: boolean;
  title: string;
  dates: Date[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
  maxHeight?: number;
}

/**
 * Consolidated date picker modal component
 * Replaces scattered date picker modals across screens
 * Provides consistent UI for date selection with optional "Today" indicator
 * Uses FlatList for performance with large date lists
 */
export default function DatePickerModal({
  visible,
  title,
  dates,
  selectedDate,
  onSelectDate,
  onClose,
  maxHeight = 380,
}: DatePickerModalProps) {
  const todayDateString = useMemo(
    () => new Date().toDateString(),
    []
  );

  const selectedDateStr = useMemo(
    () => selectedDate.toDateString(),
    [selectedDate]
  );

  const renderDateItem = ({ item: date }: { item: Date }) => {
    const dateStr = date.toDateString();
    const isSelected = dateStr === selectedDateStr;
    const isToday = dateStr === todayDateString;

    return (
      <Pressable
        style={[
          styles.dateOption,
          isSelected && styles.dateOptionActive,
        ]}
        onPress={() => {
          onSelectDate(date);
          onClose();
          Haptics.selectionAsync();
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.dateOptionText,
              isSelected && styles.dateOptionTextActive,
            ]}
          >
            {formatDateWithShortDay(date)}
            {isToday ? '  (Today)' : ''}
          </Text>
        </View>
        {isSelected && (
          <MaterialIcons
            name="check-circle"
            size={20}
            color={theme.primary}
          />
        )}
      </Pressable>
    );
  };

  return (
    <ModalBase
      visible={visible}
      title={title}
      showClose={true}
      onClose={onClose}
      closeOnOverlayPress={true}
      position="bottom"
      animationType="slide"
    >
      <FlatList
        data={dates}
        renderItem={renderDateItem}
        keyExtractor={(item) => item.getTime().toString()}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={30}
        initialNumToRender={12}
        windowSize={10}
        style={{ maxHeight }}
        showsVerticalScrollIndicator={false}
      />
    </ModalBase>
  );
}

const styles = StyleSheet.create({
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border + '40',
  },
  dateOptionActive: {
    backgroundColor: theme.primary + '08',
  },
  dateOptionText: {
    fontSize: 15,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  dateOptionTextActive: {
    fontWeight: '600',
    color: theme.primary,
  },
});
