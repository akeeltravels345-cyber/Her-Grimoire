import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import GradientScreen from '../components/GradientScreen';

const LAST_UPDATED = 'May 2025';

interface SectionProps { title: string; children: string }
function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <GradientScreen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>
        <Text style={styles.intro}>
          Grimoire is a personal witchcraft practice companion. Your privacy matters deeply to us. This policy explains what we collect, why, and how we keep it safe.
        </Text>

        <Section title="What We Collect">
          {`Grimoire stores all your practice data — rituals, journal entries, intentions, and manifestations — locally on your device using secure on-device storage (AsyncStorage). This data never leaves your phone unless you explicitly export it.

When you set up your profile, we ask for your name, spiritual tradition, and experience level. This information is stored locally on your device only.

We do not operate servers that receive, process, or store your personal practice data.`}
        </Section>

        <Section title="Notifications">
          {`If you enable ritual reminders or moon phase alerts, Grimoire schedules local push notifications on your device. These notifications are generated entirely on-device and do not involve any external servers or third-party notification services that receive your personal data.`}
        </Section>

        <Section title="Analytics & Tracking">
          {`Grimoire does not use any analytics SDKs, ad networks, or third-party tracking tools. We do not track your behaviour, sessions, or usage patterns.`}
        </Section>

        <Section title="Data Sharing">
          {`We do not sell, rent, or share your personal data with any third parties. Your rituals, intentions, journal entries, and profile information stay on your device.`}
        </Section>

        <Section title="Children's Privacy">
          {`Grimoire is not directed at children under 17. We do not knowingly collect personal information from children.`}
        </Section>

        <Section title="Data Deletion">
          {`You can delete all your practice data at any time from the app: go to Profile → Clear All Practice Data. This permanently removes everything stored by Grimoire on your device. Uninstalling the app also removes all locally stored data.`}
        </Section>

        <Section title="Changes to This Policy">
          {`We may update this policy as the app evolves. When we do, we'll update the "Last updated" date at the top of this page. Continued use of the app after changes constitutes acceptance of the updated policy.`}
        </Section>

        <Section title="Contact">
          {`If you have questions about this privacy policy or how your data is handled, please contact us at:\n\nhello@grimoire.app`}
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerGlyph}>☽</Text>
          <Text style={styles.footerText}>Your practice. Your data. Your space.</Text>
        </View>
      </ScrollView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.textPrimary },

  updated: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  intro: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: 28,
    fontFamily: theme.fonts.serif,
    fontStyle: 'italic',
  },

  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
  },

  footer: { alignItems: 'center', paddingTop: 16, gap: 8 },
  footerGlyph: { fontSize: 24, color: theme.primary },
  footerText: {
    fontSize: 13,
    color: theme.textMuted,
    fontStyle: 'italic',
    fontFamily: theme.fonts.serif,
  },
});
