import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  AccessibilityInfo,
  AccessibilityRole,
  Modal,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import Badge, { Achievement, AchievementType } from './AchievementBadge';

interface AchievementsScreenProps {
  achievements: Achievement[];
  onAchievementPress?: (achievement: Achievement) => void;
}

const AchievementsScreen: React.FC<AchievementsScreenProps> = ({
  achievements,
  onAchievementPress,
}) => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  // Group achievements by status
  const groupedAchievements = useMemo(() => {
    const unlocked = achievements.filter(a => a.isUnlocked);
    const locked = achievements.filter(a => !a.isUnlocked);

    return {
      unlocked,
      locked,
      total: achievements.length,
      unlockedCount: unlocked.length,
    };
  }, [achievements]);

  const displayedAchievements = showUnlockedOnly
    ? groupedAchievements.unlocked
    : achievements;

  const handleAchievementPress = useCallback(
    (achievement: Achievement) => {
      setSelectedAchievement(achievement);
      onAchievementPress?.(achievement);
    },
    [onAchievementPress]
  );

  const handleCloseModal = useCallback(() => {
    setSelectedAchievement(null);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Achievements</Text>
          <View style={styles.progressIndicator}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[theme.colors.primary, '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFill,
                  {
                    width: `${(groupedAchievements.unlockedCount / groupedAchievements.total) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {groupedAchievements.unlockedCount}/{groupedAchievements.total}
            </Text>
          </View>
        </View>

        {/* Filter Toggle */}
        <Pressable
          style={[styles.filterButton, showUnlockedOnly && styles.filterButtonActive]}
          onPress={() => setShowUnlockedOnly(!showUnlockedOnly)}
          accessible={true}
          accessibilityRole="switch"
          accessibilityLabel="Show unlocked achievements only"
          accessibilityState={{ checked: showUnlockedOnly }}
        >
          <MaterialIcons
            name={showUnlockedOnly ? 'check-circle' : 'radio-button-unchecked'}
            size={20}
            color={showUnlockedOnly ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.filterButtonText,
              showUnlockedOnly && styles.filterButtonTextActive,
            ]}
          >
            Unlocked
          </Text>
        </Pressable>
      </View>

      {/* Achievement Grid */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayedAchievements.length === 0 ? (
          <View
            style={styles.emptyContainer}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="No achievements yet"
          >
            <MaterialIcons name="emoji-events" size={48} color={theme.colors.placeholder} />
            <Text style={styles.emptyText}>
              Complete rituals to unlock achievements!
            </Text>
          </View>
        ) : (
          <View
            style={styles.grid}
            accessible={true}
            accessibilityRole="list"
            accessibilityLabel={`${displayedAchievements.length} achievements`}
          >
            {displayedAchievements.map((achievement, index) => (
              <Pressable
                key={achievement.id}
                style={styles.gridItem}
                onPress={() => handleAchievementPress(achievement)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${achievement.title}: ${achievement.description}${
                  achievement.unlockedAt
                    ? `. Unlocked on ${new Date(achievement.unlockedAt).toLocaleDateString()}`
                    : ''
                }`}
                accessibilityHint="Double tap to view details"
              >
                <Badge
                  achievement={achievement}
                  size="medium"
                  showLabel={true}
                  animateIn={false}
                />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Achievement Details Modal */}
      <Modal
        visible={selectedAchievement !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            {selectedAchievement && (
              <View style={styles.modalCard}>
                {/* Close Button */}
                <Pressable
                  style={styles.closeButton}
                  onPress={handleCloseModal}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Close achievement details"
                >
                  <MaterialIcons
                    name="close"
                    size={24}
                    color={theme.colors.text}
                  />
                </Pressable>

                {/* Achievement Badge */}
                <View style={styles.modalBadgeContainer}>
                  <Badge achievement={selectedAchievement} size="large" showLabel={false} />
                </View>

                {/* Achievement Info */}
                <Text style={styles.modalTitle}>{selectedAchievement.title}</Text>
                <Text style={styles.modalDescription}>
                  {selectedAchievement.description}
                </Text>

                {/* Status */}
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: selectedAchievement.isUnlocked
                          ? 'rgba(76, 175, 80, 0.1)'
                          : 'rgba(158, 158, 158, 0.1)',
                      },
                    ]}
                    accessible={true}
                    accessibilityRole="text"
                    accessibilityLabel={selectedAchievement.isUnlocked ? 'Unlocked' : 'Locked'}
                  >
                    <MaterialIcons
                      name={selectedAchievement.isUnlocked ? 'check-circle' : 'lock'}
                      size={18}
                      color={
                        selectedAchievement.isUnlocked
                          ? '#4CAF50'
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: selectedAchievement.isUnlocked
                            ? '#4CAF50'
                            : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {selectedAchievement.isUnlocked ? 'Unlocked' : 'Locked'}
                    </Text>
                  </View>

                  {selectedAchievement.unlockedAt && (
                    <Text style={styles.unlockedDate}>
                      Unlocked {new Date(selectedAchievement.unlockedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                {/* Tips */}
                {!selectedAchievement.isUnlocked && (
                  <View
                    style={styles.tipsContainer}
                    accessible={true}
                    accessibilityRole="text"
                    accessibilityLabel="How to unlock this achievement"
                  >
                    <MaterialIcons
                      name="lightbulb"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <View style={styles.tipsContent}>
                      <Text style={styles.tipsTitle}>How to unlock</Text>
                      <Text style={styles.tipsText}>
                        {selectedAchievement.description}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  progressIndicator: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: theme.colors.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  gridItem: {
    width: '30%',
    minWidth: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBadgeContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  statusContainer: {
    gap: 12,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  unlockedDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  tipsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});

export default AchievementsScreen;
