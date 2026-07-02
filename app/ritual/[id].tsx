import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useAlert } from '@/template';
import { getComputedStatus, getDaysUntil as getDaysUntilCount, Ritual } from '../../services/mockData';
import StarField from '../../components/StarField';
import ImageDisplay from '../../components/ImageDisplay';
import { RitualHeader } from '../../components/RitualHeader';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { DetailPageSkeleton } from '../../components/LoadingSkeleton';
import { resolveCategoryColor, resolveCategory } from '../../utils/categoryHelpers';
import { formatFullDate, formatFullDateWithDay, getCountdownLabel, getDaysUntil, formatShortDate, formatDateWithShortDay, formatDateWithDayAndYear, formatDateWithLongDay, formatShortMonthYear } from '../../utils/dateHelpers';
import SimpleDatePicker from '../../components/SimpleDatePicker';

const scheduleLabels: Record<string, string> = {
  daily: 'Daily', weekly: 'Weekly', moon_phase: 'Moon Phase', as_needed: 'As Needed', monthly: 'Monthly',
};

const MOON_PHASE_NAMES = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
const MOON_PHASE_EMOJIS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

function getScheduleLabel(schedule: string, scheduleDetail?: string): string {
  if (schedule === 'moon_phase' && scheduleDetail != null) {
    const idx = parseInt(scheduleDetail);
    if (!isNaN(idx) && idx >= 0 && idx < 8) return `${MOON_PHASE_EMOJIS[idx]} ${MOON_PHASE_NAMES[idx]}`;
  }
  return scheduleLabels[schedule] || schedule;
}

export default function RitualDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { rituals, categories, categoryColors, deities, deityColors, manifestations, updateRitual, deleteRitual, deleteFutureInSeries, deleteEntireSeries, stopSchedule, updateStatus, addRitual, deleteManifestationRecord } = useApp();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIntention, setEditIntention] = useState('');
  const [editTangibleOutcome, setEditTangibleOutcome] = useState('');
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [editCategory, setEditCategory] = useState(''); // Legacy support
  const [editDeities, setEditDeities] = useState<string[]>([]);
  const [editIngredients, setEditIngredients] = useState('');
  const [editScheduledDate, setEditScheduledDate] = useState<string | undefined>(undefined);
  const [editSchedule, setEditSchedule] = useState('');
  const [editScheduleDetail, setEditScheduleDetail] = useState<string | undefined>(undefined);
  const [editConsecutiveDays, setEditConsecutiveDays] = useState<number>(1);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const { showAlert } = useAlert();
  const ritual = rituals.find(r => r.id === id);

  if (!ritual) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <StarField starCount={40} showShootingStar={false} />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Ritual not found</Text>
            <Pressable onPress={() => router.back()} style={styles.backLink}>
              <Text style={styles.backLinkText}>Go back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Handle both legacy (category) and new (categories) formats
  const categoryIds = ritual.categories && ritual.categories.length > 0 ? ritual.categories : (ritual.category ? [ritual.category] : []);
  const primaryCategoryId = categoryIds[0];
  const category = resolveCategory(primaryCategoryId, categories);
  const catColor = resolveCategoryColor(primaryCategoryId, categoryColors, categories);
  const allCategories = categoryIds.map(cid => resolveCategory(cid, categories)).filter(Boolean);
  // For series/group rituals, look up by series/group manifestation ID; for others, look by ritualId
  const manif = ritual.seriesId
    ? manifestations.find(m => m.id === 'mf_series_' + ritual.seriesId)
    : ritual.groupId
    ? manifestations.find(m => m.id === 'mf_group_' + ritual.groupId)
    : manifestations.find(m => m.ritualId === ritual.id);

  const computedStatus = getComputedStatus(ritual);
  const csColor = computedStatus === 'completed' ? theme.success
    : computedStatus === 'scheduled' ? theme.accent
    : computedStatus === 'overdue' ? theme.error : theme.warning;
  const csIcon = computedStatus === 'completed' ? 'check-circle' as const
    : computedStatus === 'scheduled' ? 'event' as const
    : computedStatus === 'overdue' ? 'error-outline' as const
    : 'notifications-active' as const;
  const csLabel = computedStatus === 'completed' ? 'Completed'
    : computedStatus === 'scheduled' ? 'Scheduled'
    : computedStatus === 'overdue' ? 'Overdue' : 'Approaching';
  const daysCount = ritual.scheduledDate ? getDaysUntilCount(ritual.scheduledDate) : null;
  const countdownLabel = daysCount !== null
    ? daysCount < -1 ? `${Math.abs(daysCount)} days overdue`
    : daysCount === -1 ? '1 day overdue'
    : daysCount === 0 ? 'Today'
    : daysCount === 1 ? 'Tomorrow'
    : `In ${daysCount} days`
    : null;

  // Series info
  const isPartOfSeries = Boolean(ritual.seriesId);
  const seriesCount = isPartOfSeries ? rituals.filter(r => r.seriesId === ritual.seriesId).length : 0;
  const futureInSeries = isPartOfSeries ? rituals.filter(r =>
    r.seriesId === ritual.seriesId &&
    r.status !== 'completed' &&
    r.scheduledDate &&
    new Date(r.scheduledDate).getTime() > new Date().getTime()
  ).length : 0;

  const startEditing = () => {
    if (!ritual) return;
    setEditName(ritual.name);
    setEditDescription(ritual.description);
    setEditIntention(ritual.intention);
    setEditTangibleOutcome(ritual.tangibleOutcome || '');
    const catIds = ritual.categories && ritual.categories.length > 0 ? ritual.categories : (ritual.category ? [ritual.category] : []);
    setEditCategories(catIds);
    setEditCategory(catIds[0] || ''); // Legacy support
    setEditDeities(ritual.deities || []);
    setEditIngredients(ritual.ingredients ? ritual.ingredients.join(',') : '');
    setEditScheduledDate(ritual.scheduledDate);
    setEditSchedule(ritual.schedule);
    setEditScheduleDetail(ritual.scheduleDetail);
    setEditConsecutiveDays(ritual.consecutiveDays || 1);
    setIsEditing(true);
    Haptics.selectionAsync();
  };

  const cancelEditing = () => {
    setIsEditing(false);
    Haptics.selectionAsync();
  };

  const saveEdits = async () => {
    if (!ritual || !editName.trim()) return;

    setIsSaving(true);
    try {
      const currentConsecutiveDays = ritual.consecutiveDays || 1;
      const newConsecutiveDays = editConsecutiveDays;

      updateRitual(ritual.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        intention: editIntention.trim(),
        tangibleOutcome: editTangibleOutcome.trim(),
        categories: editCategories.length > 0 ? editCategories : [editCategory],
        deities: editDeities,
        ingredients: editIngredients.trim() ? editIngredients.split(',').map(i => i.trim()).filter(Boolean) : undefined,
        scheduledDate: editScheduledDate,
        schedule: editSchedule as Ritual['schedule'],
        scheduleDetail: editScheduleDetail,
        consecutiveDays: newConsecutiveDays,
      });

    // If extending a group ritual, create new rituals for the additional days
    if (ritual.groupId && newConsecutiveDays > currentConsecutiveDays && editScheduledDate) {
      const baseDate = new Date(editScheduledDate);
      const newRituals: Ritual[] = [];

      for (let i = currentConsecutiveDays; i < newConsecutiveDays; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        newRituals.push({
          ...ritual,
          id: ritual.id + '_g' + (i + 1),
          name: `${editName.trim()} — Day ${i + 1} of ${newConsecutiveDays}`,
          deities: editDeities,
          groupId: ritual.groupId,
          consecutiveDays: newConsecutiveDays,
          createdAt: new Date().toISOString(),
          timesPerformed: 0,
          journal: [],
          status: 'scheduled',
          scheduledDate: d.toISOString(),
        });
      }

      if (newRituals.length > 0) {
        rituals.push(...newRituals);
      }
    }

      setIsEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReschedule = () => {
    setShowRescheduleModal(true);
    setRescheduleDate(undefined);
  };

  const handleRescheduleConfirm = () => {
    if (!ritual || !rescheduleDate) return;

    // Create a new ritual instance with the selected date
    const catIds = ritual.categories && ritual.categories.length > 0 ? ritual.categories : (ritual.category ? [ritual.category] : []);
    addRitual({
      name: ritual.name,
      categories: catIds,
      deities: ritual.deities || [],
      intention: ritual.intention,
      description: ritual.description,
      tangibleOutcome: ritual.tangibleOutcome,
      ingredients: ritual.ingredients,
      schedule: ritual.schedule,
      scheduleDetail: ritual.scheduleDetail,
      imageUrl: ritual.imageUrl,
      referenceImages: ritual.referenceImages,
      libraryId: ritual.libraryId,
      scheduledDate: rescheduleDate,
    });

    setShowRescheduleModal(false);
    setRescheduleDate(undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleDelete = () => {
    // Helper function to show history choice dialog
    const showHistoryChoice = (onDeleteInstance: () => void, onDeleteWithHistory: () => void) => {
      showAlert(
        'How to Delete?',
        'Keep your practice history and journal entries, or delete everything?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Keep History', style: 'default', onPress: () => { deleteRitual(ritual.id, false); onDeleteInstance(); } },
          { text: 'Delete All', style: 'destructive', onPress: () => { deleteRitual(ritual.id, true); onDeleteWithHistory(); } },
        ]
      );
    };

    const groupSize = ritual.groupId ? rituals.filter(r => r.groupId === ritual.groupId).length : 0;

    if (ritual.groupId && groupSize > 1) {
      // Handle consecutive day group deletion
      const buttons: any[] = [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `This Day Only`,
          onPress: () => {
            showHistoryChoice(
              () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); router.back(); },
              () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); router.back(); }
            );
          }
        },
      ];

      buttons.push({
        text: `Entire ${groupSize}-Day Streak`,
        style: 'destructive',
        onPress: () => {
          const groupRituals = rituals.filter(r => r.groupId === ritual.groupId);
          showAlert(
            'Delete Entire Streak?',
            `Delete all ${groupSize} rituals in this consecutive-day streak and their history?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Keep History',
                onPress: () => {
                  groupRituals.forEach(r => deleteRitual(r.id, false));
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  router.back();
                }
              },
              {
                text: 'Delete All',
                style: 'destructive',
                onPress: () => {
                  groupRituals.forEach(r => deleteRitual(r.id, true));
                  // Explicitly delete all manifestations associated with this group
                  if (ritual.groupId) {
                    // Delete by group ID (new format)
                    const groupManif = manifestations.find(m => m.id === 'mf_group_' + ritual.groupId);
                    if (groupManif) deleteManifestationRecord(groupManif.id);
                    // Also delete any old-format manifestations for rituals in this group (backwards compatibility)
                    groupRituals.forEach(r => {
                      const oldManif = manifestations.find(m => m.id === 'mf_' + r.id);
                      if (oldManif) deleteManifestationRecord(oldManif.id);
                    });
                  }
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  router.back();
                }
              },
            ]
          );
        },
      });

      showAlert(
        'Delete Ritual',
        `This is part of a ${groupSize}-day streak. What would you like to delete?`,
        buttons
      );
    } else if (isPartOfSeries) {
      const buttons: any[] = [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'This Only',
          onPress: () => {
            showHistoryChoice(
              () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); router.back(); },
              () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); router.back(); }
            );
          }
        },
      ];

      if (futureInSeries > 0 && ritual.scheduledDate) {
        buttons.push({
          text: `This & Future (${futureInSeries})`,
          style: 'destructive',
          onPress: () => {
            showAlert(
              'Delete Future Rituals?',
              `Delete this and ${futureInSeries - 1} future ritual${futureInSeries - 1 === 1 ? '' : 's'}. Keep or delete their history?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Keep History',
                  onPress: () => {
                    // Delete future but preserve history
                    const futureRituals = rituals.filter(r =>
                      r.seriesId === ritual.seriesId &&
                      r.status !== 'completed' &&
                      r.scheduledDate &&
                      new Date(r.scheduledDate).getTime() >= new Date(ritual.scheduledDate || '').getTime()
                    );
                    futureRituals.forEach(r => deleteRitual(r.id, false));
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    router.back();
                  }
                },
                {
                  text: 'Delete All',
                  style: 'destructive',
                  onPress: () => {
                    deleteFutureInSeries(ritual.seriesId!, ritual.scheduledDate!);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    router.back();
                  }
                },
              ]
            );
          },
        });
      }

      showAlert(
        'Delete Ritual',
        `This is part of a ${getScheduleLabel(ritual.schedule, ritual.scheduleDetail)} series (${seriesCount} total). What would you like to delete?`,
        buttons
      );
    } else {
      showHistoryChoice(
        () => { router.back(); },
        () => { router.back(); }
      );
    }
  };

  const handleStopSchedule = () => {
    if (!ritual.seriesId) return;
    showAlert(
      'Stop Schedule',
      'This will remove all future scheduled occurrences of this ritual from today onward. Completed rituals and their journal entries will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Schedule',
          style: 'destructive',
          onPress: () => {
            stopSchedule(ritual.seriesId!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  function getStatusStyle(status: string) {
    switch (status) {
      case 'brewing':  return { bg: theme.primary + '18', border: theme.primary, color: theme.primary, label: '\ud83e\ude84 Brewing', icon: 'hourglass-top' as const };
      case 'stirring': return { bg: '#4EA8DE22', border: '#4EA8DE', color: '#4EA8DE', label: '\ud83c\udf0a Stirring', icon: 'eco' as const };
      case 'spilled':  return { bg: theme.success + '18', border: theme.success, color: theme.success, label: '\u2b50 Spilled', icon: 'star' as const };
      default: return { bg: theme.surfaceLight, border: theme.border, color: theme.textMuted, label: 'Unknown', icon: 'help' as const };
    }
  }

  function getStatusLabel(s?: string) {
    switch (s) {
      case 'approaching': return { color: theme.warning, label: 'Approaching', icon: 'notifications-active' as const };
      case 'completed': return { color: theme.success, label: 'Completed', icon: 'check-circle' as const };
      default: return { color: theme.accent, label: 'Scheduled', icon: 'event' as const };
    }
  }

  const msStyle = getStatusLabel(ritual.status);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Category-tinted wash fading from top */}
      <LinearGradient
        colors={[catColor + '28', catColor + '10', 'transparent']}
        locations={[0, 0.4, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}
        pointerEvents="none"
      />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <StarField starCount={40} showShootingStar={false} />
      <View style={styles.header}>
        <Pressable onPress={isEditing ? cancelEditing : () => router.back()} style={styles.headerBtn}>
          <MaterialIcons name={isEditing ? 'close' : 'arrow-back'} size={24} color={theme.textPrimary} />
        </Pressable>
        {isEditing ? (
          <Text style={styles.headerEditTitle}>Editing</Text>
        ) : null}
        <View style={{ flex: 1 }} />
        {isEditing ? (
          <Pressable onPress={saveEdits} style={[styles.headerBtn, styles.saveEditBtn]} disabled={!editName.trim()}>
            <MaterialIcons name="check" size={22} color={editName.trim() ? theme.background : theme.textMuted} />
          </Pressable>
        ) : (
          <>
            {computedStatus === 'completed' ? (
              <Pressable
                onPress={() => {
                  updateStatus(ritual.id, 'scheduled');
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                style={styles.headerBtn}
                hitSlop={8}
              >
                <MaterialIcons name="undo" size={22} color={theme.error} />
              </Pressable>
            ) : null}
            <Pressable onPress={startEditing} style={styles.headerBtn}>
              <MaterialIcons name="edit" size={22} color={theme.accent} />
            </Pressable>
            {isPartOfSeries && futureInSeries > 0 ? (
              <Pressable onPress={handleStopSchedule} style={styles.headerBtn}>
                <MaterialIcons name="stop-circle" size={22} color={theme.warning} />
              </Pressable>
            ) : null}
            <Pressable onPress={handleDelete} style={styles.headerBtn}>
              <MaterialIcons name="delete-outline" size={22} color={theme.error} />
            </Pressable>
          </>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Ritual Header - Now Uses Extracted Component */}
        <RitualHeader
          ritual={ritual}
          isEditing={isEditing}
          editName={editName}
          editCategories={editCategories}
          editDeities={editDeities}
          categories={categories}
          categoryColors={categoryColors}
          deities={deities}
          deityColors={deityColors}
          catColor={catColor}
          onEditName={setEditName}
          onEditCategories={setEditCategories}
          onEditDeities={setEditDeities}
        />

        {!isEditing && (
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <MaterialIcons name="schedule" size={12} color={theme.textSecondary} />
              <Text style={styles.tagText}>{getScheduleLabel(ritual.schedule, ritual.scheduleDetail)}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: msStyle.color + '20' }]}>
              <MaterialIcons name={msStyle.icon} size={12} color={msStyle.color} />
              <Text style={[styles.tagText, { color: msStyle.color }]}>{msStyle.label}</Text>
            </View>
            {(isPartOfSeries || Boolean(ritual.groupId)) ? (
              <View style={[styles.tag, { backgroundColor: theme.accent + '15' }]}>
                <MaterialIcons name="repeat" size={12} color={theme.accent} />
                <Text style={[styles.tagText, { color: theme.accent }]}>
                  {isPartOfSeries ? `Series (${seriesCount})` : `Group (${rituals.filter(r => r.groupId === ritual.groupId).length})`}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Ritual Image */}
        {ritual.imageUrl ? (
          <View style={styles.imageSection}>
            <Text style={styles.imageSectionLabel}>RITUAL REFERENCE IMAGE</Text>
            <ImageDisplay imageUri={ritual.imageUrl} size={220} />
          </View>
        ) : null}

        {/* Status Bar */}
        <View style={[styles.statusBar, { borderLeftColor: csColor, backgroundColor: csColor + '08' }]}>
          <MaterialIcons name={csIcon} size={16} color={csColor} />
          <Text style={[styles.statusBarLabel, { color: csColor }]}>
            {csLabel}{ritual.scheduledDate
              ? ` · ${formatFullDate(ritual.scheduledDate)}`
              : ''}
          </Text>
          {(computedStatus === 'approaching' || computedStatus === 'overdue') && countdownLabel ? (
            <Text style={[styles.statusBarCountdown, { color: computedStatus === 'overdue' ? theme.error : theme.warning }]}>
              {countdownLabel}
            </Text>
          ) : null}
        </View>

        {/* Stop Schedule Banner (for series with future rituals) */}
        {isPartOfSeries && futureInSeries > 0 ? (
          <Pressable style={styles.stopBanner} onPress={handleStopSchedule}>
            <MaterialIcons name="stop-circle" size={18} color={theme.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.stopBannerTitle}>Recurring {getScheduleLabel(ritual.schedule, ritual.scheduleDetail)} Schedule</Text>
              <Text style={styles.stopBannerSub}>{futureInSeries} future occurrence{futureInSeries !== 1 ? 's' : ''} remaining</Text>
            </View>
            <Text style={styles.stopBannerAction}>Stop</Text>
          </Pressable>
        ) : null}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ritual.timesPerformed}</Text>
            <Text style={styles.statLabel}>Performed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{manif ? manif.results.length : 0}</Text>
            <Text style={styles.statLabel}>Results</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {ritual.lastPerformed ? formatShortDate(ritual.lastPerformed) : 'Never'}
            </Text>
            <Text style={styles.statLabel}>Last Done</Text>
          </View>
        </View>

         {/* Intention */}
        {isEditing ? (
          <View style={styles.editSection}>
            <Text style={styles.editFieldLabel}>Intention</Text>
            <TextInput style={[styles.editInput, styles.editTextArea]} value={editIntention} onChangeText={setEditIntention} placeholder="What is the purpose of this ritual?" placeholderTextColor={theme.textMuted} multiline textAlignVertical="top" />
          </View>
        ) : (
          <View style={styles.intentionCard}>
            <MaterialIcons name="auto-awesome" size={18} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.intentionLabel}>INTENTION</Text>
              <Text style={styles.intentionText}>{ritual.intention}</Text>
            </View>
          </View>
        )}

        {/* Tangible Outcome */}
        {isEditing ? (
          <View style={styles.editSection}>
            <Text style={styles.editFieldLabel}>Tangible Outcome</Text>
            <TextInput style={[styles.editInput, styles.editTextArea]} value={editTangibleOutcome} onChangeText={setEditTangibleOutcome} placeholder="What specific result are you asking for?" placeholderTextColor={theme.textMuted} multiline textAlignVertical="top" />
          </View>
        ) : ritual.tangibleOutcome ? (
          <View style={styles.outcomeCard}>
            <View style={styles.outcomeHeader}>
              <MaterialIcons name="flag" size={18} color={theme.primary} />
              <Text style={styles.outcomeLabel}>TANGIBLE OUTCOME</Text>
            </View>
            <Text style={styles.outcomeText}>{ritual.tangibleOutcome}</Text>
            {manif ? (
              <Pressable style={styles.outcomeManifLink}
                onPress={() => router.push({ pathname: '/add-manifestation', params: { ritualId: ritual.id } })}>
                {(() => {
                  const ss = getStatusStyle(manif.status);
                  return (
                    <>
                      <MaterialIcons name={ss.icon} size={14} color={ss.color} />
                      <Text style={[styles.outcomeManifText, { color: ss.color }]}>{ss.label}</Text>
                      {manif.status !== 'spilled' ? (
                        <Text style={styles.outcomeManifAction}>Log a Sign</Text>
                      ) : null}
                    </>
                  );
                })()}
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Description */}
        {isEditing ? (
          <View style={styles.editSection}>
            <Text style={styles.editFieldLabel}>Description</Text>
            <TextInput style={[styles.editInput, styles.editTextArea]} value={editDescription} onChangeText={setEditDescription} placeholder="Describe the ritual process..." placeholderTextColor={theme.textMuted} multiline textAlignVertical="top" />
          </View>
        ) : ritual.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            <Text style={styles.descriptionText}>{ritual.description}</Text>
          </View>
        ) : null}


        {/* Ingredients */}
{isEditing ? (
  <View style={styles.editSection}>
    <Text style={styles.editFieldLabel}>Ingredients & Tools</Text>
    <View>
      {editIngredients.split(',').map((ing, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <TextInput
            style={{ flex: 1, backgroundColor: theme.surface, borderRadius: 10, padding: 12, fontSize: 15, color: theme.textPrimary, borderWidth: 1.5, borderColor: theme.primary + '30' }}
            value={ing.trim()}
            onChangeText={(text) => {
              const parts = editIngredients.split(',');
              parts[i] = text;
              setEditIngredients(parts.join(','));
            }}
            placeholder="Ingredient..."
            placeholderTextColor={theme.textMuted}
          />
          <Pressable
            hitSlop={12}
            onPress={() => {
              const parts = editIngredients.split(',').filter((_, idx) => idx !== i);
              setEditIngredients(parts.length > 0 ? parts.join(',') : '');
            }}
          >
            <MaterialIcons name="remove-circle-outline" size={24} color={theme.error} />
          </Pressable>
        </View>
      ))}
      <Pressable
        hitSlop={12}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: theme.primary + '10', borderRadius: 10, borderWidth: 1, borderColor: theme.primary + '30' }}
        onPress={() => {
          setEditIngredients(editIngredients.length > 0 ? editIngredients + ',' : '');
        }}
      >
        <MaterialIcons name="add-circle-outline" size={22} color={theme.primary} />
        <Text style={{ fontSize: 14, color: theme.primary, fontWeight: '700', letterSpacing: 0.3 }}>Add Ingredient</Text>
      </Pressable>
    </View>
  </View>
) : null}

        {/* Reference Images */}
        {ritual.referenceImages && ritual.referenceImages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>REFERENCE IMAGES</Text>
            <View style={styles.referenceImagesGrid}>
              {ritual.referenceImages.map((imgUrl, idx) => (
                <ImageDisplay key={idx} imageUri={imgUrl} size={120} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Schedule Type */}
        {isEditing ? (
          <View style={styles.editSection}>
            <Text style={styles.editFieldLabel}>Schedule Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {(['as_needed', 'daily', 'weekly', 'monthly', 'moon_phase'] as const).map(s => {
                const label = scheduleLabels[s];
                const isActive = editSchedule === s;
                return (
                  <Pressable
                    key={s}
                    style={[styles.editInput, { flex: 0, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: isActive ? theme.primary + '20' : theme.surface, borderColor: isActive ? theme.primary : theme.border }]}
                    onPress={() => { setEditSchedule(s); if (s !== 'moon_phase') setEditScheduleDetail(undefined); Haptics.selectionAsync(); }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? theme.primary : theme.textSecondary }}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {editSchedule === 'moon_phase' && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.editFieldLabel, { fontSize: 11, marginBottom: 6 }]}>Moon Phase</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {MOON_PHASE_NAMES.map((name, idx) => {
                    const isActive = editScheduleDetail === String(idx);
                    return (
                      <Pressable
                        key={idx}
                        style={[styles.editInput, { flex: 0, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: isActive ? theme.primary + '20' : theme.surface, borderColor: isActive ? theme.primary : theme.border }]}
                        onPress={() => { setEditScheduleDetail(String(idx)); Haptics.selectionAsync(); }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: isActive ? theme.primary : theme.textSecondary }}>{MOON_PHASE_EMOJIS[idx]} {name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        ) : null}

        {/* Scheduled Date */}
        {isEditing ? (
          <View style={styles.editSection}>
            <Text style={styles.editFieldLabel}>Scheduled Date</Text>
            <Pressable style={styles.editInput} onPress={() => setShowEditDatePicker(true)}>
              <Text style={{ color: editScheduledDate ? theme.textPrimary : theme.textMuted, fontSize: 15 }}>
                {editScheduledDate
                  ? formatDateWithDayAndYear(editScheduledDate)
                  : 'No date set — tap to add'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Consecutive Days */}
        {isEditing && ritual.groupId ? (
          <View style={styles.editSection}>
            <Text style={styles.editFieldLabel}>Duration (Days)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                style={[styles.editInput, { flex: 0, width: 60, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' }]}
                onPress={() => setEditConsecutiveDays(Math.max(1, editConsecutiveDays - 1))}
              >
                <MaterialIcons name="remove" size={20} color={theme.accent} />
              </Pressable>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary, minWidth: 40, textAlign: 'center' }}>
                {editConsecutiveDays}
              </Text>
              <Pressable
                style={[styles.editInput, { flex: 0, width: 60, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' }]}
                onPress={() => setEditConsecutiveDays(editConsecutiveDays + 1)}
              >
                <MaterialIcons name="add" size={20} color={theme.accent} />
              </Pressable>
            </View>
            {editConsecutiveDays > (ritual.consecutiveDays || 1) && (
              <Text style={{ fontSize: 12, color: theme.success, marginTop: 8 }}>
                Will add {editConsecutiveDays - (ritual.consecutiveDays || 1)} new day(s)
              </Text>
            )}
          </View>
        ) : null}

        <Modal visible={showEditDatePicker} transparent animationType="slide">
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} onPress={() => setShowEditDatePicker(false)}>
            <Pressable style={{ backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, maxHeight: '80%' }} onPress={() => {}}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: theme.textPrimary }}>Select Date</Text>
                <Pressable onPress={() => setShowEditDatePicker(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceLight, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="close" size={22} color={theme.textPrimary} />
                </Pressable>
              </View>
              <ScrollView style={{ paddingHorizontal: 16, paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
                <SimpleDatePicker
                  selectedDate={editScheduledDate ? new Date(editScheduledDate) : new Date()}
                  onSelectDate={(date) => {
                    setEditScheduledDate(date.toISOString());
                    setShowEditDatePicker(false);
                    Haptics.selectionAsync();
                  }}
                  minDate={(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })()}
                  maxDate={(() => { const d = new Date(); d.setDate(d.getDate() + 90); return d; })()}
                />
                {editScheduledDate ? (
                  <Pressable
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, marginTop: 12, borderRadius: theme.radius.md, backgroundColor: theme.error + '10', borderWidth: 1, borderColor: theme.error + '30' }}
                    onPress={() => { setEditScheduledDate(undefined); setShowEditDatePicker(false); }}
                  >
                    <MaterialIcons name="close" size={18} color={theme.error} />
                    <Text style={{ fontSize: 14, color: theme.error, fontWeight: '600', marginLeft: 10 }}>Remove date</Text>
                  </Pressable>
                ) : null}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Ingredients (view mode) */}
        {!isEditing && ritual.ingredients && ritual.ingredients.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INGREDIENTS & TOOLS</Text>
            <View style={styles.ingredientsList}>
              {ritual.ingredients.map((item, i) => (
                <View key={i} style={styles.ingredientItem}>
                  <View style={styles.ingredientDot} />
                  <Text style={styles.ingredientText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Manifestation Section */}
        {manif ? (
          <View style={[styles.section, { marginTop: 8 }]}>
            <View style={styles.manifHeader}>
              <Text style={styles.sectionLabel}>MANIFESTATION</Text>
              {(() => {
                const ss = getStatusStyle(manif.status);
                return (
                  <View style={[styles.manifStatusBadge, { backgroundColor: ss.bg, borderColor: ss.border }]}>
                    <MaterialIcons name={ss.icon} size={12} color={ss.color} />
                    <Text style={[styles.manifStatusText, { color: ss.color }]}>{ss.label}</Text>
                  </View>
                );
              })()}
            </View>

            <View style={styles.manifIntentionBox}>
              <Text style={styles.manifIntention}>{manif.intention}</Text>
            </View>

            {manif.results.length > 0 ? (
              <View style={styles.manifResultsList}>
                {manif.results.map(r => (
                  <View key={r.id} style={[styles.manifResult, { borderLeftColor: r.type === 'manifested' ? theme.success : '#4EA8DE' }]}>
                    <View style={styles.manifResultHeader}>
                      <Text style={[styles.manifResultType, { color: r.type === 'manifested' ? theme.success : '#4EA8DE' }]}>
                        {r.type === 'manifested' ? '⭐ Spilled' : `${r.signType ? { dream: '🌙', omen: '🦅', encounter: '👁️', symbol: '✦', number: '🔢', synchronicity: '✨' }[r.signType] ?? '✦' : '✦'} Sign`}
                      </Text>
                      <Text style={styles.manifResultDate}>
                        {formatShortDate(r.date)}
                      </Text>
                    </View>
                    <Text style={styles.manifResultNote}>{r.note}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {manif.status !== 'spilled' ? (
              <Pressable style={styles.addManifestBtn} onPress={() => router.push({ pathname: '/add-manifestation', params: { ritualId: ritual.id } })}>
                <MaterialIcons name="add-circle-outline" size={16} color={theme.success} />
                <Text style={styles.addManifestText}>Log a Sign</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Journal Section */}
        <View style={[styles.section, { marginTop: 8 }]}>
          <View style={styles.journalHeader}>
            <Text style={styles.sectionLabel}>JOURNAL</Text>
            <Text style={styles.journalCount}>{ritual.journal.length} {ritual.journal.length === 1 ? 'entry' : 'entries'}</Text>
          </View>

          {ritual.journal.length === 0 ? (
            <View style={styles.emptyJournal}>
              <Image source={require('../../assets/images/journal-empty.png')} style={{ width: 100, height: 100, marginBottom: 12 }} contentFit="contain" />
              <Text style={styles.emptyJournalText}>No journal entries yet</Text>
              <Pressable
                onPress={() => router.push({ pathname: '/log-ritual', params: { ritualId: ritual.id, mode: 'reflect' } })}
                style={styles.reflectEmptyBtn}
              >
                <MaterialIcons name="edit-note" size={16} color={theme.primary} />
                <Text style={styles.reflectEmptyBtnText}>Add a Reflection</Text>
              </Pressable>
            </View>
          ) : (
            ritual.journal.map((entry) => (
              <Pressable
                key={entry.id}
                style={[styles.journalEntry, { borderLeftColor: catColor + '90' }]}
                onPress={() => router.push({ pathname: '/journal-entry/[id]' as any, params: { id: entry.id, ritualId: ritual.id } })}
              >
                <View style={styles.journalEntryHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.journalDate}>
                      {formatDateWithLongDay(entry.date)}
                    </Text>
                    {entry.cosmicContext ? (
                      <Text style={styles.journalCosmic}>{entry.cosmicContext}</Text>
                    ) : null}
                  </View>
                  {/* Display all moods, or fallback to single mood for legacy entries */}
                  <View style={styles.moodBadges}>
                    {(entry.moods && entry.moods.length > 0 ? entry.moods : (entry.mood ? [entry.mood] : [])).map((m, idx) => (
                      <View key={idx} style={[styles.moodBadge, { backgroundColor: catColor + '18' }]}>
                        <Text style={[styles.moodText, { color: catColor }]}>{m}</Text>
                      </View>
                    ))}
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} style={{ marginLeft: 4 }} />
                </View>
                {entry.notes ? <Text style={styles.journalNotes} numberOfLines={3}>{entry.notes}</Text> : null}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Reschedule Modal */}
      <Modal visible={showRescheduleModal} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} onPress={() => setShowRescheduleModal(false)}>
          <Pressable style={{ backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, maxHeight: '80%' }} onPress={() => {}}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: theme.textPrimary }}>Reschedule Spell</Text>
              <Pressable onPress={() => setShowRescheduleModal(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceLight, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="close" size={22} color={theme.textPrimary} />
              </Pressable>
            </View>
            <ScrollView style={{ paddingHorizontal: 16, paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
              <SimpleDatePicker
                selectedDate={rescheduleDate ? new Date(rescheduleDate) : new Date()}
                onSelectDate={(date) => {
                  setRescheduleDate(date.toISOString());
                  Haptics.selectionAsync();
                }}
                minDate={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })()}
                maxDate={(() => { const d = new Date(); d.setFullYear(d.getFullYear() + 2); return d; })()}
              />
            </ScrollView>
            {rescheduleDate ? (
              <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: theme.border }}>
                <Pressable
                  style={{ backgroundColor: catColor, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                  onPress={handleRescheduleConfirm}
                >
                  <Text style={{ color: theme.background, fontSize: 16, fontWeight: '700' }}>Reschedule for {formatShortMonthYear(rescheduleDate)}</Text>
                </Pressable>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Floating Buttons */}
      <View style={[styles.floatingContainer, { bottom: insets.bottom + 16 }]}>
        {/* Single-instance rituals (as_needed): different logic */}
        {ritual.schedule === 'as_needed' ? (
          <>
            {computedStatus === 'completed' ? (
              <>
                {manif ? (
                  <Pressable style={styles.manifestButton} onPress={() => router.push({ pathname: '/add-manifestation', params: { ritualId: ritual.id } })}>
                    <Text style={styles.manifestButtonText}>Manifest</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.reflectBtn}
                  onPress={() => router.push({ pathname: '/log-ritual', params: { ritualId: ritual.id, mode: 'reflect' } })}
                >
                  <Text style={styles.reflectBtnText}>Reflect</Text>
                </Pressable>
                <Pressable style={[styles.completeRitualBtn, { backgroundColor: catColor }]} onPress={handleReschedule}>
                  <Text style={styles.completeRitualBtnText}>Reschedule</Text>
                </Pressable>
              </>
            ) : (
              <Pressable style={[styles.completeRitualBtn, { flex: 1 }]} onPress={() => {
                router.push({ pathname: '/log-ritual', params: { ritualId: ritual.id, returnTo: '/(tabs)/rituals' } });
              }}>
                <Text style={styles.completeRitualBtnText}>Log Complete</Text>
              </Pressable>
            )}
          </>
        ) : (
          <>
            {/* Multi-day rituals: current behavior */}
            {manif ? (
              <Pressable style={styles.manifestButton} onPress={() => router.push({ pathname: '/add-manifestation', params: { ritualId: ritual.id } })}>
                <Text style={styles.manifestButtonText}>Manifest</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={styles.reflectBtn}
              onPress={() => router.push({ pathname: '/log-ritual', params: { ritualId: ritual.id, mode: 'reflect' } })}
            >
              <Text style={styles.reflectBtnText}>Reflect</Text>
            </Pressable>
            {computedStatus === 'completed' ? (
              <Pressable style={[styles.completeRitualBtn, { backgroundColor: catColor }]} onPress={handleReschedule}>
                <Text style={styles.completeRitualBtnText}>Reschedule</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.completeRitualBtn} onPress={() => router.push({ pathname: '/log-ritual', params: { ritualId: ritual.id } })}>
                <Text style={styles.completeRitualBtnText}>Log</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      {/* Loading overlay */}
      {isSaving && (
        <Modal transparent={true} visible={isSaving} animationType="none">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: theme.radius.lg, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
              <LoadingSpinner size={52} color={theme.primary} />
              <Text style={{ marginTop: 20, fontSize: 16, fontWeight: '600', color: theme.textPrimary }}>Saving...</Text>
            </View>
          </View>
        </Modal>
      )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 18, color: theme.textSecondary, marginBottom: 16 },
  backLink: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: theme.surface, borderRadius: theme.radius.md },
  backLinkText: { fontSize: 14, color: theme.primary, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerEditTitle: { fontSize: 16, fontWeight: '600', color: theme.textSecondary, marginLeft: 4 },
  saveEditBtn: { backgroundColor: theme.success, borderRadius: 22 },
  ritualHeader: { alignItems: 'center', paddingBottom: 20, paddingTop: 8 },
  categoryRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  categoryBadge: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  ritualName: { fontSize: 26, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', marginBottom: 10, lineHeight: 34, fontFamily: theme.fonts.serif },
  nameSeparator: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, width: '60%' },
  nameSeparatorLine: { flex: 1, height: 1 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: theme.surfaceLight },
  tagText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },

  imageSection: { alignItems: 'center', marginBottom: 20, marginHorizontal: 16 },
  imageSectionLabel: { fontSize: 10, fontWeight: '700', color: theme.textMuted, letterSpacing: 1, marginBottom: 12, textAlign: 'center' },

  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderLeftWidth: 3, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 16,
  },
  statusBarLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  statusBarCountdown: { fontSize: 12, fontWeight: '700' },

  // Stop Schedule Banner
  stopBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.warning + '0A', borderWidth: 1, borderColor: theme.warning + '30',
    borderRadius: theme.radius.md, padding: 14, marginBottom: 16,
  },
  stopBannerTitle: { fontSize: 13, fontWeight: '600', color: theme.textPrimary },
  stopBannerSub: { fontSize: 11, color: theme.textSecondary, marginTop: 1 },
  stopBannerAction: { fontSize: 13, fontWeight: '700', color: theme.warning },

  statsRow: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: theme.radius.md, padding: 18, marginBottom: 20, ...theme.shadows.card },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
  statLabel: { fontSize: 10, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: theme.border, marginVertical: 4 },

  outcomeCard: { backgroundColor: theme.success + '10', borderRadius: theme.radius.md, padding: 16, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: theme.success },
  outcomeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  outcomeLabel: { fontSize: 10, fontWeight: '700', color: theme.success, letterSpacing: 1 },
  outcomeText: { fontSize: 14, color: theme.textPrimary, lineHeight: 20, fontWeight: '500', marginBottom: 10 },
  outcomeManifLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border + '40' },
  outcomeManifText: { fontSize: 12, fontWeight: '600' },
  outcomeManifAction: { marginLeft: 'auto', fontSize: 12, fontWeight: '600', color: theme.primary },

  section: { marginBottom: 20, marginHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 10 },
  descriptionText: { fontSize: 15, color: theme.textSecondary, lineHeight: 22 },
  referenceImagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  intentionCard: { flexDirection: 'row', gap: 12, backgroundColor: theme.primary + '10', borderRadius: theme.radius.md, padding: 16, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: theme.primary },
  intentionLabel: { fontSize: 10, fontWeight: '700', color: theme.primary, letterSpacing: 1, marginBottom: 4 },
  intentionText: { fontSize: 14, color: theme.textPrimary, lineHeight: 20, fontStyle: 'italic', fontFamily: theme.fonts.serif },
  ingredientsList: { backgroundColor: theme.surface, borderRadius: theme.radius.md, padding: 16, gap: 10, ...theme.shadows.card },
  ingredientItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ingredientDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent },
  ingredientText: { fontSize: 14, color: theme.textSecondary, fontWeight: '500' },

  // Edit mode
  editSection: { marginBottom: 16 },
  editFieldLabel: { fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  editInput: { backgroundColor: theme.surface, borderRadius: theme.radius.md, padding: 14, fontSize: 15, color: theme.textPrimary, borderWidth: 1.5, borderColor: theme.primary + '30' },
  editTextArea: { minHeight: 80, paddingTop: 14, lineHeight: 21 },
  editHint: { fontSize: 11, color: theme.textMuted, marginTop: 4, fontStyle: 'italic' },
  editCatScroll: { marginBottom: 12 },
  editCatRow: { gap: 8, paddingVertical: 4 },
  editCatChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border },
  editCatChipText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  editCatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  editCatCounter: { fontSize: 12, fontWeight: '600', color: theme.textMuted },
  editCatIconWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  editCatCheck: { position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  manifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  manifStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  manifStatusText: { fontSize: 11, fontWeight: '600' },
  manifIntentionBox: { backgroundColor: theme.surface, borderRadius: theme.radius.md, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: theme.primary, ...theme.shadows.card },
  manifIntention: { fontSize: 14, color: theme.textPrimary, lineHeight: 20, fontStyle: 'italic', fontFamily: theme.fonts.serif },
  manifResultsList: { gap: 8, marginBottom: 12 },
  manifResult: { backgroundColor: theme.surfaceLight, borderLeftWidth: 2, paddingHorizontal: 12, paddingVertical: 10, borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  manifResultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  manifResultType: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  manifResultDate: { fontSize: 11, color: theme.textMuted },
  manifResultNote: { fontSize: 13, color: theme.textPrimary, lineHeight: 19 },
  addManifestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderWidth: 1, borderColor: theme.success + '40', borderRadius: theme.radius.md, backgroundColor: theme.success + '08' },
  addManifestText: { fontSize: 13, fontWeight: '600', color: theme.success },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: theme.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' as const, marginBottom: 10 },

  journalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  journalCount: { fontSize: 13, color: theme.textMuted },
  emptyJournal: { alignItems: 'center', paddingVertical: 24, backgroundColor: theme.surface, borderRadius: theme.radius.md },
  emptyJournalText: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 },
  emptyJournalSub: { fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
  journalEntry: { backgroundColor: theme.surface, borderRadius: theme.radius.md, padding: 16, marginBottom: 10, borderLeftWidth: 3, ...theme.shadows.card },
  journalEntryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  journalDate: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  journalCosmic: { fontSize: 11, color: theme.textMuted, marginTop: 3, fontStyle: 'italic' },
  moodBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
  moodBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  moodText: { fontSize: 11, fontWeight: '600' },
  journalNotes: { fontSize: 14, color: theme.textPrimary, lineHeight: 20, fontFamily: theme.fonts.serif, marginTop: 8 },

  reflectEmptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.primary + '40', backgroundColor: theme.primary + '10' },
  reflectEmptyBtnText: { fontSize: 13, fontWeight: '600', color: theme.primary },

  floatingContainer: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', gap: 10 },
  manifestButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.success, paddingVertical: 16, borderRadius: theme.radius.lg, ...theme.shadows.elevated },
  manifestButtonText: { fontSize: 14, fontWeight: '700', color: theme.background },
  reflectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: theme.primary + '12', paddingVertical: 16,
    borderRadius: theme.radius.lg, borderWidth: 1.5, borderColor: theme.primary + '30',
    ...theme.shadows.elevated,
  },
  reflectBtnText: { fontSize: 14, fontWeight: '700', color: theme.primary },
  completeRitualBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.radius.lg,
    ...theme.shadows.elevated,
  },
  completeRitualBtnText: { fontSize: 14, fontWeight: '700', color: theme.background, letterSpacing: 0.3 },
});
