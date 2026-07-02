import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import StarField from '../../components/StarField';
import ProgressBar from '../../components/ProgressBar';
import ImageDisplay from '../../components/ImageDisplay';
import SpilledExplanationModal from '../../components/SpilledExplanationModal';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { DetailPageSkeleton } from '../../components/LoadingSkeleton';
import { formatFullDateWithDay } from '../../utils/dateHelpers';
import { resolveCategoryColor } from '../../utils/categoryHelpers';

const SIGN_TYPE_LABELS: Record<string, string> = {
  dream: '🌙 Dream',
  omen: '🦅 Omen',
  encounter: '👁️ Encounter',
  symbol: '◆ Symbol',
  number: '🔢 Repeated Number',
  synchronicity: '✨ Synchronicity',
};

const STATUS_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  brewing: { label: 'Brewing', emoji: '🫖', color: '#8878A8' },
  stirring: { label: 'Stirring', emoji: '🌀', color: '#F5A962' },
  spilled: { label: 'Manifested', emoji: '✨', color: '#7ED4A8' },
};

export default function ManifestationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { manifestations, rituals, categories, categoryColors, deleteManifestationResult } =
    useApp();

  const manifestation = manifestations.find(
    (m) => m.id === id || m.ritualId === id || m.id === 'mf_series_' + id || m.id === 'mf_group_' + id
  );

  const ritual = manifestation
    ? rituals.find((r) => r.id === manifestation.ritualId)
    : null;

  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSpilledExplanation, setShowSpilledExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!manifestation) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <StarField starCount={40} showShootingStar={false} />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Manifestation not found</Text>
            <Pressable onPress={() => router.back()} style={styles.backLink}>
              <Text style={styles.backLinkText}>Go back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Calculate progress: total results as an indicator of progress towards manifestation
  // Brewing = 0%, Stirring = 50%, Spilled = 100%
  const getProgressFromStatus = () => {
    if (manifestation.status === 'spilled') return 1;
    if (manifestation.status === 'stirring') return 0.5 + (manifestation.results.length * 0.01);
    return Math.min(0.4, manifestation.results.length * 0.05);
  };

  const progress = getProgressFromStatus();
  const statusInfo = STATUS_LABELS[manifestation.status];

  const handleDeleteResult = (resultId: string) => {
    Haptics.selectionAsync();
    setSelectedResultId(resultId);
    setShowDeleteModal(true);
  };

  const confirmDeleteResult = async () => {
    if (!selectedResultId) return;
    setIsLoading(true);
    try {
      deleteManifestationResult(manifestation.id, selectedResultId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowDeleteModal(false);
      setSelectedResultId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryColorList = manifestation.categories.map(
    (cat) => resolveCategoryColor(cat, categoryColors, categories, theme.primary)
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <StarField starCount={40} showShootingStar={false} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: insets.bottom + 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
            </Pressable>
            <Text style={styles.pageTitle} numberOfLines={1}>Manifestation</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Status badge */}
          <View style={[styles.statusBadgeContainer, { backgroundColor: statusInfo.color + '20' }]}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusEmoji}>{statusInfo.emoji}</Text>
              <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
            {manifestation.status === 'spilled' && (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowSpilledExplanation(true);
                }}
                style={styles.infoButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="info" size={18} color={statusInfo.color} />
              </Pressable>
            )}
          </View>

          {/* Intention card */}
          <View style={styles.intentionCard}>
            <Text style={styles.cardLabel}>INTENTION</Text>
            <Text style={styles.intentionText}>&ldquo;{manifestation.intention}&rdquo;</Text>
            {ritual && (
              <Text style={styles.ritualName}>— {ritual.name}</Text>
            )}
          </View>

          {/* Spilled manifestation contextual help */}
          {manifestation.status === 'spilled' && (
            <View style={styles.spilledHelpSection}>
              <View style={styles.spilledHelpContent}>
                <Text style={styles.spilledHelpEmoji}>✨</Text>
                <View style={styles.spilledHelpText}>
                  <Text style={styles.spilledHelpTitle}>Your intention has manifested!</Text>
                  <Text style={styles.spilledHelpDescription}>
                    The universe has delivered your desired outcome. Celebrate this magical moment and acknowledge the power of your intention-setting.
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowSpilledExplanation(true);
                }}
                style={styles.spilledHelpLink}
              >
                <Text style={styles.spilledHelpLinkText}>Learn more</Text>
                <MaterialIcons name="chevron-right" size={16} color={theme.primary} />
              </Pressable>
            </View>
          )}

          {/* Categories */}
          {manifestation.categories.length > 0 && (
            <View style={styles.categoriesContainer}>
              <Text style={styles.sectionLabel}>CATEGORIES</Text>
              <View style={styles.categoryBadges}>
                {manifestation.categories.map((cat, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: categoryColorList[idx] + '30' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryBadgeText,
                        { color: categoryColorList[idx] },
                      ]}
                    >
                      {cat}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Progress indicator */}
          <View style={styles.progressSection}>
            <Text style={styles.sectionLabel}>MANIFESTATION PROGRESS</Text>
            <ProgressBar
              progress={progress}
              label="Journey to Manifestation"
              showPercentage={true}
              height={14}
              fillColor={statusInfo.color}
              animated={true}
            />
            <View style={styles.progressExplainer}>
              <MaterialIcons
                name="info"
                size={16}
                color={theme.textMuted}
              />
              <Text style={styles.progressExplainerText}>
                Track signs and record when your intention manifests
              </Text>
            </View>
          </View>

          {/* Results/Signs */}
          <View style={styles.resultsSection}>
            <View style={styles.resultsSectionHeader}>
              <Text style={styles.sectionLabel}>SIGNS & RESULTS</Text>
              <Text style={styles.resultCount}>
                {manifestation.results.length}
              </Text>
            </View>

            {manifestation.results.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>🔮</Text>
                <Text style={styles.emptyStateText}>No signs logged yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Log signs and manifestation results to track your intention&rsquo;s journey
                </Text>
              </View>
            ) : (
              <View style={styles.resultsList}>
                {manifestation.results.map((result, idx) => (
                  <View key={result.id} style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <View style={styles.resultTypeContainer}>
                        <Text style={styles.resultTypeEmoji}>
                          {result.type === 'manifested'
                            ? '✨'
                            : SIGN_TYPE_LABELS[result.signType || 'symbol']?.charAt(0) || '🌙'}
                        </Text>
                        <View style={styles.resultMetadata}>
                          <Text style={styles.resultType}>
                            {result.type === 'manifested'
                              ? 'Manifestation'
                              : SIGN_TYPE_LABELS[result.signType || 'symbol']}
                          </Text>
                          <Text style={styles.resultDate}>
                            {formatFullDateWithDay(result.date)}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => handleDeleteResult(result.id)}
                        style={styles.deleteButton}
                      >
                        <MaterialIcons
                          name="delete-outline"
                          size={20}
                          color={theme.error}
                        />
                      </Pressable>
                    </View>

                    {/* Result note */}
                    <Text style={styles.resultNote}>{result.note}</Text>

                    {/* Result image */}
                    {result.imageUrl && (
                      <View style={styles.resultImageContainer}>
                        <ImageDisplay imageUri={result.imageUrl} size={200} />
                      </View>
                    )}

                    {idx < manifestation.results.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push({
                  pathname: '/add-manifestation',
                  params: { ritualId: manifestation.ritualId },
                });
              }}
            >
              <MaterialIcons name="add" size={20} color={theme.background} />
              <Text style={styles.primaryButtonText}>Log Sign or Manifestation</Text>
            </Pressable>

            {manifestation.status !== 'spilled' && (
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push({
                    pathname: '/add-manifestation',
                    params: { ritualId: manifestation.ritualId, mode: 'spill' },
                  });
                }}
              >
                <MaterialIcons name="star" size={20} color={theme.primary} />
                <Text style={styles.secondaryButtonText}>Mark as Manifested</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Spilled explanation modal */}
      <SpilledExplanationModal
        visible={showSpilledExplanation}
        onClose={() => setShowSpilledExplanation(false)}
      />

      {/* Delete confirmation modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete this record?</Text>
            <Text style={styles.modalMessage}>
              This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonSecondary,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isLoading}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonDanger,
                  pressed && styles.buttonPressed,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={confirmDeleteResult}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <Text style={styles.modalButtonDangerText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  backLink: {
    marginTop: 16,
  },
  backLinkText: {
    ...theme.typography.button,
    color: theme.primary,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.surface,
  },
  pageTitle: {
    ...theme.typography.pageTitle,
    color: theme.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusEmoji: {
    fontSize: 18,
  },
  statusLabel: {
    ...theme.typography.badge,
    fontWeight: '700',
  },
  intentionCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    ...theme.shadows.card,
  },
  cardLabel: {
    ...theme.typography.sectionLabel,
    color: theme.textMuted,
    marginBottom: 8,
  },
  intentionText: {
    ...theme.typography.body,
    color: theme.textPrimary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  ritualName: {
    ...theme.typography.bodySmall,
    color: theme.textSecondary,
  },
  spilledHelpSection: {
    marginBottom: 24,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.primary + '15',
    borderRadius: theme.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
  },
  spilledHelpContent: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  spilledHelpEmoji: {
    fontSize: 28,
    marginTop: 2,
  },
  spilledHelpText: {
    flex: 1,
    gap: 4,
  },
  spilledHelpTitle: {
    ...theme.typography.cardTitle,
    color: theme.textPrimary,
  },
  spilledHelpDescription: {
    ...theme.typography.bodySmall,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  spilledHelpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  spilledHelpLinkText: {
    ...theme.typography.button,
    color: theme.primary,
    fontWeight: '600',
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    ...theme.typography.sectionLabel,
    color: theme.textMuted,
    marginBottom: 12,
  },
  categoryBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  categoryBadgeText: {
    ...theme.typography.badge,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 32,
  },
  progressExplainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.surfaceLight,
    borderRadius: theme.radius.md,
  },
  progressExplainerText: {
    ...theme.typography.bodySmall,
    color: theme.textMuted,
    flex: 1,
    marginTop: 2,
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultCount: {
    ...theme.typography.badge,
    color: theme.primary,
    backgroundColor: theme.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: theme.surfaceLight,
    borderRadius: theme.radius.lg,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    ...theme.typography.cardTitle,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    ...theme.typography.bodySmall,
    color: theme.textMuted,
    textAlign: 'center',
  },
  resultsList: {
    gap: 16,
  },
  resultCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    ...theme.shadows.card,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resultTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  resultTypeEmoji: {
    fontSize: 24,
  },
  resultMetadata: {
    flex: 1,
    gap: 2,
  },
  resultType: {
    ...theme.typography.cardTitle,
    color: theme.textPrimary,
  },
  resultDate: {
    ...theme.typography.bodySmall,
    color: theme.textMuted,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultNote: {
    ...theme.typography.body,
    color: theme.textPrimary,
    marginBottom: 12,
    lineHeight: 22,
  },
  resultImageContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginTop: 16,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    ...theme.shadows.card,
  },
  primaryButton: {
    backgroundColor: theme.primary,
  },
  primaryButtonText: {
    ...theme.typography.button,
    color: theme.background,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  secondaryButtonText: {
    ...theme.typography.button,
    color: theme.primary,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.radius.lg,
    padding: 24,
    width: '100%',
    ...theme.shadows.elevated,
  },
  modalTitle: {
    ...theme.typography.cardTitle,
    color: theme.textPrimary,
    marginBottom: 8,
  },
  modalMessage: {
    ...theme.typography.body,
    color: theme.textSecondary,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.radius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: theme.surface,
  },
  modalButtonSecondaryText: {
    ...theme.typography.button,
    color: theme.textPrimary,
  },
  modalButtonDanger: {
    backgroundColor: theme.error,
  },
  modalButtonDangerText: {
    ...theme.typography.button,
    color: theme.textPrimary,
    fontWeight: '700',
  },
});
