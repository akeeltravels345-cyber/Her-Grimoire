import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  Animated, Easing, Platform, KeyboardAvoidingView, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_COLORS } from '../constants/config';

const { width: SCREEN_W } = Dimensions.get('window');

const PROFILE_KEY = 'grimoire_profile';

// ─── Animated star dots ───────────────────────────────────────────────────────
function StarDot({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.8, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View
      style={{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: '#C9A0DC', opacity }}
    />
  );
}

const STARS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: Math.random() * SCREEN_W,
  y: Math.random() * 700,
  size: Math.random() * 2.5 + 1,
  delay: Math.random() * 2500,
}));

// ─── Moon glyph ───────────────────────────────────────────────────────────────
function AnimatedMoon() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.Text style={[styles.moonGlyph, { transform: [{ scale }] }]}>☽</Animated.Text>
  );
}

// ─── Step dot indicator ───────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < current
              ? styles.dotDone
              : i === current
              ? styles.dotActive
              : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────
function CategoryCard({
  cat, selected, onToggle,
}: { cat: typeof DEFAULT_CATEGORIES[0]; selected: boolean; onToggle: () => void }) {
  const color = DEFAULT_CATEGORY_COLORS[cat.id] || theme.primary;
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.catCard, selected && { borderColor: color, backgroundColor: color + '18' }]}
    >
      <View style={[styles.catIcon, { backgroundColor: color + '22' }]}>
        <MaterialIcons name={cat.icon as any} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.catName, selected && { color }]}>{cat.name}</Text>
        <Text style={styles.catDesc} numberOfLines={1}>{cat.description}</Text>
      </View>
      {selected && <MaterialIcons name="check-circle" size={20} color={color} />}
    </Pressable>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setCoreCategories, markOnboarded } = useApp();

  const [step, setStep] = useState(0); // 0=welcome, 1=name, 2=pillars, 3=ready
  const [firstName, setFirstName] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const TOTAL_STEPS = 4;

  const animateTransition = (nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    Haptics.selectionAsync();
    animateTransition(step + 1);
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    animateTransition(step - 1);
  };

  const toggleCat = (id: string) => {
    Haptics.selectionAsync();
    setSelectedCats(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Save name to profile
    if (firstName.trim()) {
      const existing = await AsyncStorage.getItem(PROFILE_KEY);
      const profile = existing ? JSON.parse(existing) : {};
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({
        ...profile,
        firstName: firstName.trim(),
      }));
    }

    // Save core categories (default to first 3 if none chosen)
    const cats = selectedCats.length > 0
      ? selectedCats
      : DEFAULT_CATEGORIES.slice(0, 3).map(c => c.id);
    setCoreCategories(cats);

    markOnboarded();
    router.replace('/(tabs)');
  };

  const displayName = firstName.trim() || 'Practitioner';

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Deep purple gradient */}
      <LinearGradient
        colors={['rgba(155,109,181,0.22)', 'rgba(100,60,160,0.1)', 'transparent']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        pointerEvents="none"
      />

      {/* Stars */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {STARS.map(s => <StarDot key={s.id} x={s.x} y={s.y} size={s.size} delay={s.delay} />)}
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Back button */}
          <View style={styles.topRow}>
            {step > 0 ? (
              <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
                <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
              </Pressable>
            ) : <View style={{ width: 40 }} />}
            <StepDots current={step} total={TOTAL_STEPS} />
            <View style={{ width: 40 }} />
          </View>

          <Animated.View
            style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            {/* ── Step 0: Welcome ── */}
            {step === 0 && (
              <ScrollView
                contentContainerStyle={styles.stepContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <AnimatedMoon />
                <Text style={styles.appName}>Grimoire</Text>
                <Text style={styles.tagline}>Your witchcraft practice,{'\n'}illuminated.</Text>
                <Text style={styles.welcomeBody}>
                  Track your rituals, set intentions, cast your spells, and watch your work unfold — all in one sacred space.
                </Text>

                <View style={styles.featureList}>
                  {[
                    { icon: 'auto-fix-high', label: 'Ritual tracking & scheduling' },
                    { icon: 'stars', label: 'Monthly intentions & review' },
                    { icon: 'auto-awesome', label: 'Manifestation journaling' },
                    { icon: 'nightlight-round', label: 'Moon phase awareness' },
                  ].map(f => (
                    <View key={f.label} style={styles.featureRow}>
                      <MaterialIcons name={f.icon as any} size={18} color={theme.primary} />
                      <Text style={styles.featureLabel}>{f.label}</Text>
                    </View>
                  ))}
                </View>

                <Pressable style={styles.primaryBtn} onPress={handleNext}>
                  <LinearGradient
                    colors={[theme.primary + 'EE', theme.primaryDark + 'EE']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtnGradient}
                  >
                    <Text style={styles.primaryBtnText}>Begin your practice ✦</Text>
                  </LinearGradient>
                </Pressable>
              </ScrollView>
            )}

            {/* ── Step 1: Name ── */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepGlyph}>✦</Text>
                <Text style={styles.stepTitle}>What shall we call you?</Text>
                <Text style={styles.stepSubtitle}>
                  Your practice is personal. Let's make this feel like home.
                </Text>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.nameInput}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Your name or craft name..."
                    placeholderTextColor={theme.textMuted}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleNext}
                  />
                </View>

                <Text style={styles.optionalHint}>You can always change this in your profile.</Text>

                <Pressable style={styles.primaryBtn} onPress={handleNext}>
                  <LinearGradient
                    colors={[theme.primary + 'EE', theme.primaryDark + 'EE']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtnGradient}
                  >
                    <Text style={styles.primaryBtnText}>Continue</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable onPress={handleNext} style={styles.skipBtn}>
                  <Text style={styles.skipText}>Skip for now</Text>
                </Pressable>
              </View>
            )}

            {/* ── Step 2: Core pillars ── */}
            {step === 2 && (
              <View style={[styles.stepContainer, { flex: 1 }]}>
                <Text style={styles.stepGlyph}>☽</Text>
                <Text style={styles.stepTitle}>Your sacred pillars</Text>
                <Text style={styles.stepSubtitle}>
                  Choose the areas you want to track month-to-month. You can always adjust these later.
                </Text>

                <ScrollView
                  style={{ flex: 1, width: '100%' }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.catList}>
                    {DEFAULT_CATEGORIES.map(cat => (
                      <CategoryCard
                        key={cat.id}
                        cat={cat}
                        selected={selectedCats.includes(cat.id)}
                        onToggle={() => toggleCat(cat.id)}
                      />
                    ))}
                  </View>
                  <View style={{ height: 120 }} />
                </ScrollView>

                <View style={styles.stickyBottom}>
                  <Pressable style={styles.primaryBtn} onPress={handleNext}>
                    <LinearGradient
                      colors={[theme.primary + 'EE', theme.primaryDark + 'EE']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.primaryBtnGradient}
                    >
                      <Text style={styles.primaryBtnText}>
                        {selectedCats.length > 0 ? `Set ${selectedCats.length} pillar${selectedCats.length > 1 ? 's' : ''}` : 'Choose later'}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}

            {/* ── Step 3: Ready ── */}
            {step === 3 && (
              <View style={styles.stepContainer}>
                <Text style={styles.readyGlyph}>✦</Text>
                <Text style={styles.stepTitle}>
                  Welcome, {displayName}.
                </Text>
                <Text style={styles.stepSubtitle}>
                  Your grimoire is ready. Your practice starts now.
                </Text>

                {/* Summary */}
                <View style={styles.summaryCard}>
                  {firstName.trim() ? (
                    <View style={styles.summaryRow}>
                      <MaterialIcons name="person" size={16} color={theme.primary} />
                      <Text style={styles.summaryText}>{firstName.trim()}</Text>
                    </View>
                  ) : null}
                  {selectedCats.length > 0 ? (
                    <View style={styles.summaryRow}>
                      <MaterialIcons name="auto-awesome" size={16} color={theme.primary} />
                      <Text style={styles.summaryText}>
                        {selectedCats
                          .map(id => DEFAULT_CATEGORIES.find(c => c.id === id)?.name)
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.summaryRow}>
                    <MaterialIcons name="nightlight-round" size={16} color={theme.accent} />
                    <Text style={styles.summaryText}>Moon phase awareness enabled</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <MaterialIcons name="stars" size={16} color={'#C9A84C'} />
                    <Text style={styles.summaryText}>Monthly intention flow ready</Text>
                  </View>
                </View>

                <Pressable style={styles.primaryBtn} onPress={handleFinish}>
                  <LinearGradient
                    colors={[theme.primary + 'EE', theme.primaryDark + 'EE']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtnGradient}
                  >
                    <Text style={styles.primaryBtnText}>Enter the Grimoire ✦</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dots: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  dot: { borderRadius: 5 },
  dotDone: { width: 7, height: 7, backgroundColor: theme.primary + 'AA' },
  dotActive: { width: 10, height: 10, backgroundColor: theme.primary },
  dotInactive: { width: 7, height: 7, backgroundColor: 'rgba(255,255,255,0.18)' },

  content: { flex: 1 },

  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 32,
  },

  // Welcome
  moonGlyph: {
    fontSize: 72,
    color: theme.primary,
    marginBottom: 16,
    textShadowColor: 'rgba(201,160,220,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  appName: {
    fontSize: 42,
    fontWeight: '700',
    color: '#F5D5E0',
    fontFamily: theme.fonts.serif,
    letterSpacing: 1,
    marginBottom: 10,
    textShadowColor: 'rgba(201,160,220,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 18,
    color: theme.textSecondary,
    textAlign: 'center',
    fontFamily: theme.fonts.serif,
    fontStyle: 'italic',
    lineHeight: 26,
    marginBottom: 20,
  },
  welcomeBody: {
    fontSize: 15,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 28,
  },
  featureList: { width: '100%', gap: 12, marginBottom: 36 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  featureLabel: { fontSize: 14, fontWeight: '500', color: theme.textSecondary },

  // Steps
  stepGlyph: { fontSize: 40, color: theme.primary, marginBottom: 16, marginTop: 8 },
  readyGlyph: {
    fontSize: 52,
    color: '#C9A84C',
    marginBottom: 16,
    marginTop: 8,
    textShadowColor: 'rgba(201,168,76,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F5D5E0',
    fontFamily: theme.fonts.serif,
    textAlign: 'center',
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 15,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 4,
  },

  // Name input
  inputWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(201,160,220,0.3)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 4,
    marginBottom: 12,
  },
  nameInput: {
    fontSize: 20,
    color: '#F5D5E0',
    fontFamily: theme.fonts.serif,
    padding: 16,
    textAlign: 'center',
  },
  optionalHint: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 36,
    fontStyle: 'italic',
  },

  // Category cards
  catList: { width: '100%', gap: 10 },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  catIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 },
  catDesc: { fontSize: 12, color: theme.textMuted },

  // Sticky bottom for pillars step
  stickyBottom: {
    position: 'absolute',
    bottom: 32,
    left: 28,
    right: 28,
  },

  // Summary card
  summaryCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,160,220,0.18)',
    marginBottom: 36,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryText: { fontSize: 14, color: theme.textSecondary, flex: 1, fontWeight: '500' },

  // Buttons
  primaryBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  primaryBtnGradient: { paddingVertical: 17, alignItems: 'center', borderRadius: 14 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#F5D5E0', fontFamily: theme.fonts.serif, letterSpacing: 0.3 },

  skipBtn: { marginTop: 16, paddingVertical: 10 },
  skipText: { fontSize: 13, color: theme.textMuted, fontWeight: '600' },
});
