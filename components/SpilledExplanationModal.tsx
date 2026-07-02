import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import ModalBase from './ModalBase';

interface SpilledExplanationModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * SpilledExplanationModal
 * Explains what "Spilled" means in the context of manifestations.
 * A spilled manifestation is one that has manifested (the intention came true)
 * either on the set timeline or in an unexpected/unplanned way.
 */
export default function SpilledExplanationModal({
  visible,
  onClose,
}: SpilledExplanationModalProps) {
  return (
    <ModalBase
      visible={visible}
      title="What Does 'Spilled' Mean?"
      showClose={true}
      onClose={onClose}
      position="center"
      actions={[
        {
          label: 'Got it',
          onPress: onClose,
          variant: 'primary',
        },
      ]}
    >
      <View style={styles.content}>
        {/* Main explanation */}
        <View style={styles.section}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.mainText}>
            When a manifestation has &ldquo;spilled,&rdquo; it means your intention has come to life in the physical world.
          </Text>
        </View>

        {/* What it means */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What This Means</Text>
          <Text style={styles.bodyText}>
            Your intention has manifested — the desired outcome has occurred or the goal has been achieved.
          </Text>
        </View>

        {/* How it happens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Happens</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bulletLabel}>On your timeline:</Text> The manifestation occurs exactly when you set it to
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bulletLabel}>Before or differently:</Text> The universe delivers your intention in an unexpected or unplanned way
              </Text>
            </View>
          </View>
        </View>

        {/* Why it matters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why It Matters</Text>
          <Text style={styles.bodyText}>
            Recording spilled manifestations celebrates your magical work and helps you recognize patterns in how your intentions come to fruition. It&apos;s a powerful reminder of your connection to intention-setting.
          </Text>
        </View>

        {/* Contextual note */}
        <View style={[styles.section, styles.noteSection]}>
          <MaterialIcons name="info" size={16} color={theme.primary} />
          <Text style={styles.noteText}>
            You can mark a manifestation as spilled by logging the manifestation result when it comes true.
          </Text>
        </View>
      </View>
    </ModalBase>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
  },
  section: {
    gap: 8,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  mainText: {
    ...theme.typography.cardBody,
    color: theme.textPrimary,
    lineHeight: 24,
  },
  sectionTitle: {
    ...theme.typography.cardTitle,
    color: theme.textPrimary,
    marginBottom: 4,
  },
  bodyText: {
    ...theme.typography.body,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  bulletList: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    gap: 10,
  },
  bulletPoint: {
    ...theme.typography.body,
    color: theme.primary,
    marginTop: 2,
  },
  bulletText: {
    ...theme.typography.body,
    color: theme.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
  bulletLabel: {
    fontWeight: '600',
    color: theme.textPrimary,
  },
  noteSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.primary + '15',
    borderRadius: theme.radius.md,
    alignItems: 'flex-start',
  },
  noteText: {
    ...theme.typography.bodySmall,
    color: theme.textSecondary,
    flex: 1,
    marginTop: 2,
  },
});
