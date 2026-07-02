import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, LayoutAnimation, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';

interface ProgressiveDisclosureSectionProps {
  title: string;
  isEssential?: boolean;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  icon?: string;
  description?: string;
}

/**
 * ProgressiveDisclosureSection - Collapsible form section for organizing related fields
 * Shows essential sections by default, optional sections collapsed
 */
export default function ProgressiveDisclosureSection({
  title,
  isEssential = false,
  defaultExpanded = false,
  children,
  icon,
  description,
}: ProgressiveDisclosureSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isEssential);

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(
          250,
          LayoutAnimation.Types.easeInEaseOut,
          LayoutAnimation.Properties.opacity,
        ),
      );
    }
    setIsExpanded(!isExpanded);
    Haptics.selectionAsync();
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.header,
          isEssential && styles.essentialHeader,
          isExpanded && styles.headerExpanded,
        ]}
        onPress={handleToggle}
      >
        <View style={styles.headerContent}>
          {icon && (
            <MaterialIcons
              name={icon as any}
              size={20}
              color={isEssential ? theme.primary : theme.textSecondary}
            />
          )}
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  isEssential && styles.essentialTitle,
                ]}
              >
                {title}
              </Text>
              {isEssential && (
                <View style={styles.essentialBadge}>
                  <Text style={styles.essentialBadgeText}>Required</Text>
                </View>
              )}
            </View>
            {description && !isExpanded && (
              <Text style={styles.description} numberOfLines={1}>
                {description}
              </Text>
            )}
          </View>
        </View>
        <MaterialIcons
          name={isExpanded ? 'expand-less' : 'expand-more'}
          size={24}
          color={isEssential ? theme.primary : theme.textSecondary}
        />
      </Pressable>

      {isExpanded && (
        <View style={styles.content}>
          {description && (
            <Text style={styles.fullDescription}>{description}</Text>
          )}
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  essentialHeader: {
    backgroundColor: theme.primary + '08',
    borderBottomWidth: 1,
    borderBottomColor: theme.primary + '25',
  },
  headerExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleContainer: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  essentialTitle: {
    color: theme.primary,
  },
  essentialBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: theme.primary + '25',
    borderRadius: 6,
  },
  essentialBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  fullDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
});
