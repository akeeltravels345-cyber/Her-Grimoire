import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  Animated, Easing, Platform, KeyboardAvoidingView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

// ── Experience levels ─────────────────────────────────────────────────────────
const EXPERIENCE_LEVELS = [
  { id: 'new',        label: 'Just beginning',      sub: 'New to witchcraft & ritual practice' },
  { id: 'exploring',  label: 'Still exploring',      sub: 'Learning my path, dabbling in traditions' },
  { id: 'established',label: 'Established practice', sub: 'Consistent rituals, know my craft' },
  { id: 'seasoned',   label: 'Seasoned practitioner',sub: 'Years of dedicated practice behind me' },
  { id: 'elder',      label: 'Elder / Teacher',      sub: 'I guide others in their craft too' },
];

// ── Traditions ────────────────────────────────────────────────────────────────
const TRADITIONS = [
  'Eclectic',
  'Wiccan',
  'Traditional Witchcraft',
  'Hoodoo / Rootwork',
  'Green Witch',
  'Kitchen Witch',
  'Hedge Witch',
  'Chaos Magick',
  'Ceremonial Magick',
  'Secular Witchcraft',
  'Hellenic / Greek',
  'Norse / Heathen',
  'Vodou / Voodoo',
  'Santería / Lucumí',
  'Brujería',
  'Other',
];

// ── Animated star background ──────────────────────────────────────────────────
function StarDot({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.7, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: '#C9A0DC', opacity }}
    />
  );
}

const STARS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: Math.random() * SCREEN_W,
  y: Math.random() * 800,
  size: Math.random() * 2.5 + 1,
  delay: Math.random() * 2500,
}));

// ── Breathing moon ────────────────────────────────────────────────────────────
function AnimatedMoon() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.07, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.Text style={[styles.moonGlyph, { transform: [{ scale }] }]}>☽</Animated.Text>;
}

// ── Step dots ─────────────────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < current ? styles.dotDone : i === current ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ── Category card ─────────────────────────────────────────────────────────────
function CategoryCard({ cat, selected, onToggle }: {
  cat: typeof DEFAULT_CATEGORIES[0]; selected: boolean; onToggle: () => void;
}) {
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
      {selected
        ? <MaterialIcons name="check-circle" size={20} color={color} />
        : <View style={styles.catUnchecked} />
      }
    </Pressable>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
const TOTAL_STEPS = 5; // 0=welcome 1=name 2=path+level 3=pillars 4=ready

export default function OnboardingScreen() {
  const router = useRouter();
  const { setCoreCategories, markOnboarded } = useApp();

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [tradition, setTradition] = useState('');
  const [customTradition, setCustomTradition] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const transition = (next: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -24, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const next = () => { Haptics.selectionAsync(); transition(step + 1); };
  const back = () => { Haptics.selectionAsync(); transition(step - 1); };

  const toggleCat = (id: string) => {
    Haptics.selectionAsync();
    setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const selectTradition = (t: string) => {
    Haptics.selectionAsync();
    setTradition(t === tradition ? '' : t);
    if (t !== 'Other') setCustomTradition('');
  };

  const selectLevel = (id: string) => {
    Haptics.selectionAsync();
    setExperienceLevel(id);
  };

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const resolvedTradition = tradition === 'Other' ? customTradition.trim() : tradition;

    // Persist full profile
    const existing = await AsyncStorage.getItem(PROFILE_KEY);
    const profile = existing ? JSON.parse(existing) : {};
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({
      ...profile,
      firstName: firstName.trim(),
      tradition: resolvedTradition,
      experienceLevel,
    }));

    const cats = selectedCats.length > 0 ? selectedCats : DEFAULT_CATEGORIES.slice(0, 3).map(c => c.id);
    setCoreCategories(cats);
    markOnboarded();
    router.replace('/(tabs)');
  };

  const nameOk = firstName.trim().length > 0;
  const pathOk = experienceLevel !== ''; // tradition is optional, level is required
  const displayName = firstName.trim() || 'Practitioner';
  const resolvedTradition = tradition === 'Other' ? customTradition.trim() : tradition;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <LinearGradient
        colors={['rgba(155,109,181,0.22)', 'rgba(100,60,160,0.1)', 'transparent']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        pointerEvents="none"
      />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {STARS.map(s => <StarDot key={s.id} x={s.x} y={s.y} size={s.size} delay={s.delay} />)}
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          {/* Top bar */}
          <View style={styles.topRow}>
            {step > 0
              ? <Pressable onPress={back} style={styles.backBtn} hitSlop={12}>
                  <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
                </Pressable>
              : <View style={{ width: 40 }} />
            }
            <StepDots current={step} total={TOTAL_STEPS} />
            <View style={{ width: 40 }} />
          </View>

          <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            {/* ─────────────── STEP 0 — Welcome ─────────────── */}
            {step === 0 && (
              <ScrollView contentContainerStyle={styles.stepWrap} showsVerticalScrollIndicator={false}>
                <AnimatedMoon />
                <Text style={styles.appName}>Grimoire</Text>
                <Text style={styles.tagline}>Your witchcraft practice,{'\n'}illuminated.</Text>
                <Text style={styles.body}>
                  Track rituals, set intentions, cast your spells, and watch your work unfold — all in one sacred space.
                </Text>

                <View style={styles.featureList}>
                  {[
                    { icon: 'auto-fix-high', text: 'Ritual tracking & scheduling' },
                    { icon: 'stars',         text: 'Monthly intentions & review' },
                    { icon: 'auto-awesome',  text: 'Manifestation journaling' },
                    { icon: 'nightlight-round', text: 'Moon phase awareness' },
                  ].map(f => (
                    <View key={f.text} style={styles.featureRow}>
                      <MaterialIcons name={f.icon as any} size={18} color={theme.primary} />
                      <Text style={styles.featureText}>{f.text}</Text>
                    </View>
                  ))}
                </View>

                <Pressable style={styles.btn} onPress={next}>
                  <LinearGradient colors={[theme.primary + 'EE', theme.primaryDark + 'EE']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGrad}>
                    <Text style={styles.btnText}>Begin your practice ✦</Text>
                  </LinearGradient>
                </Pressable>
              </ScrollView>
            )}

            {/* ─────────────── STEP 1 — Name ─────────────── */}
            {step === 1 && (
              <View style={styles.stepWrap}>
                <Text style={styles.stepGlyph}>✦</Text>
                <Text style={styles.stepTitle}>What shall we call you?</Text>
                <Text style={styles.stepSub}>Your name or craft name — this is your space.</Text>

                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.nameInput}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Name or craft name..."
                    placeholderTextColor={theme.textMuted}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={() => { if (nameOk) next(); }}
                  />
                </View>

                <Pressable style={[styles.btn, !nameOk && styles.btnDisabled]} onPress={nameOk ? next : undefined}>
                  <LinearGradient colors={[theme.primary + 'EE', theme.primaryDark + 'EE']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGrad}>
                    <Text style={styles.btnText}>Continue</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {/* ─────────────── STEP 2 — Path & Level ─────────────── */}
            {step === 2 && (
              <View style={[styles.stepWrap, { flex: 1 }]}>
                <Text style={styles.stepGlyph}>☽</Text>
                <Text style={styles.stepTitle}>Tell us about your path</Text>
                <Text style={styles.stepSub}>Helps us understand who practices with Grimoire.</Text>

                <ScrollView style={{ flex: 1, width: '100%' }} showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">

                  {/* Tradition */}
                  <Text style={styles.fieldLabel}>TRADITION / PATH  <Text style={styles.optional}>(optional)</Text></Text>
                  <View style={styles.chipWrap}>
                    {TRADITIONS.map(t => (
                      <Pressable
                        key={t}
                        onPress={() => selectTradition(t)}
                        style={[styles.chip, tradition === t && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, tradition === t && styles.chipTextActive]}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {tradition === 'Other' && (
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.inlineInput}
                        value={customTradition}
                        onChangeText={setCustomTradition}
                        placeholder="Describe your tradition..."
                        placeholderTextColor={theme.textMuted}
                        autoFocus
                      />
                    </View>
                  )}

                  {/* Experience level */}
                  <Text style={[styles.fieldLabel, { marginTop: 24 }]}>WHERE ARE YOU IN YOUR PRACTICE?</Text>
                  <View style={styles.levelList}>
                    {EXPERIENCE_LEVELS.map(lv => (
                      <Pressable
                        key={lv.id}
                        onPress={() => selectLevel(lv.id)}
                        style={[styles.levelCard, experienceLevel === lv.id && styles.levelCardActive]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.levelLabel, experienceLevel === lv.id && { color: theme.primary }]}>
                            {lv.label}
                          </Text>
                          <Text style={styles.levelSub}>{lv.sub}</Text>
                        </View>
                        {experienceLevel === lv.id
                          ? <MaterialIcons name="radio-button-checked" size={20} color={theme.primary} />
                          : <MaterialIcons name="radio-button-unchecked" size={20} color={theme.textMuted} />
                        }
                      </Pressable>
                    ))}
                  </View>

                  <View style={{ height: 120 }} />
                </ScrollView>

                {/* Sticky CTA */}
                <View style={styles.stickyBottom}>
                  <Pressable style={[styles.btn, !pathOk && styles.btnDisabled]} onPress={pathOk ? next : undefined}>
                    <LinearGradient colors={[theme.primary + 'EE', theme.primaryDark + 'EE']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGrad}>
                      <Text style={styles.btnText}>Continue</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}

            {/* ─────────────── STEP 3 — Pillars ─────────────── */}
            {step === 3 && (
              <View style={[styles.stepWrap, { flex: 1 }]}>
                <Text style={styles.stepGlyph}>✦</Text>
                <Text style={styles.stepTitle}>Your sacred pillars</Text>
                <Text style={styles.stepSub}>Choose the areas you want to track each month. Adjust anytime.</Text>

                <ScrollView style={{ flex: 1, width: '100%' }} showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">
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
                  <Pressable style={styles.btn} onPress={next}>
                    <LinearGradient colors={[theme.primary + 'EE', theme.primaryDark + 'EE']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGrad}>
                      <Text style={styles.btnText}>
                        {selectedCats.length > 0
                          ? `Set ${selectedCats.length} pillar${selectedCats.length > 1 ? 's' : ''}`
                          : 'Choose later'}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}

            {/* ─────────────── STEP 4 — Ready ─────────────── */}
            {step === 4 && (
              <ScrollView contentContainerStyle={styles.stepWrap} showsVerticalScrollIndicator={false}>
                <Text style={styles.readyGlyph}>✦</Text>
                <Text style={styles.stepTitle}>Welcome, {displayName}.</Text>
                <Text style={styles.stepSub}>Your grimoire is ready. Your practice starts now.</Text>

                <View style={styles.summaryCard}>
                  <SummaryRow icon="person" text={firstName.trim()} />
                  {resolvedTradition ? <SummaryRow icon="auto-fix-high" text={resolvedTradition} /> : null}
                  {experienceLevel ? (
                    <SummaryRow
                      icon="trending-up"
                      text={EXPERIENCE_LEVELS.find(l => l.id === experienceLevel)?.label || ''}
                    />
                  ) : null}
                  {selectedCats.length > 0 ? (
                    <SummaryRow
                      icon="auto-awesome"
                      text={selectedCats
                        .map(id => DEFAULT_CATEGORIES.find(c => c.id === id)?.name)
                        .filter(Boolean)
                        .join(' · ')}
                    />
                  ) : null}
                  <SummaryRow icon="nightlight-round" color={theme.accent} text="Moon phase awareness on" />
                  <SummaryRow icon="stars" color="#C9A84C" text="Monthly intention flow ready" />
                </View>

                <Pressable style={styles.btn} onPress={handleFinish}>
                  <LinearGradient colors={[theme.primary + 'EE', theme.primaryDark + 'EE']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGrad}>
                    <Text style={styles.btnText}>Enter the Grimoire ✦</Text>
                  </LinearGradient>
                </Pressable>
              </ScrollView>
            )}

          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function SummaryRow({ icon, text, color = theme.primary }: { icon: string; text: string; color?: string }) {
  if (!text) return null;
  return (
    <View style={styles.summaryRow}>
      <MaterialIcons name={icon as any} size={16} color={color} />
      <Text style={styles.summaryText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  dots: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  dot: { borderRadius: 5 },
  dotDone:     { width: 7,  height: 7,  backgroundColor: theme.primary + 'AA' },
  dotActive:   { width: 10, height: 10, backgroundColor: theme.primary },
  dotInactive: { width: 7,  height: 7,  backgroundColor: 'rgba(255,255,255,0.18)' },

  stepWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },

  // Welcome
  moonGlyph: {
    fontSize: 72, color: theme.primary, marginBottom: 16,
    textShadowColor: 'rgba(201,160,220,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30,
  },
  appName: {
    fontSize: 42, fontWeight: '700', color: '#F5D5E0',
    fontFamily: theme.fonts.serif, letterSpacing: 1, marginBottom: 10,
    textShadowColor: 'rgba(201,160,220,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  tagline: {
    fontSize: 18, color: theme.textSecondary, textAlign: 'center',
    fontFamily: theme.fonts.serif, fontStyle: 'italic', lineHeight: 26, marginBottom: 20,
  },
  body: { fontSize: 15, color: theme.textMuted, textAlign: 'center', lineHeight: 23, marginBottom: 28 },
  featureList: { width: '100%', gap: 10, marginBottom: 36 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: theme.border,
  },
  featureText: { fontSize: 14, fontWeight: '500', color: theme.textSecondary },

  // Step header
  stepGlyph: { fontSize: 40, color: theme.primary, marginBottom: 16, marginTop: 8 },
  readyGlyph: {
    fontSize: 52, color: '#C9A84C', marginBottom: 16, marginTop: 8,
    textShadowColor: 'rgba(201,168,76,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  stepTitle: {
    fontSize: 26, fontWeight: '700', color: '#F5D5E0',
    fontFamily: theme.fonts.serif, textAlign: 'center', marginBottom: 10,
  },
  stepSub: {
    fontSize: 15, color: theme.textMuted, textAlign: 'center',
    lineHeight: 22, marginBottom: 28, paddingHorizontal: 4,
  },

  // Inputs
  inputBox: {
    width: '100%', borderWidth: 1, borderColor: 'rgba(201,160,220,0.3)',
    borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 28,
  },
  nameInput: {
    fontSize: 20, color: '#F5D5E0', fontFamily: theme.fonts.serif,
    padding: 16, textAlign: 'center',
  },
  inlineInput: {
    fontSize: 15, color: '#F5D5E0', fontFamily: theme.fonts.serif,
    padding: 14,
  },

  // Tradition chips
  fieldLabel: {
    fontSize: 10, fontWeight: '700', color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.2,
    alignSelf: 'flex-start', marginBottom: 12,
  },
  optional: { fontSize: 10, fontWeight: '400', color: theme.textMuted, textTransform: 'none', letterSpacing: 0 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8, width: '100%' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: theme.border,
  },
  chipActive: { backgroundColor: theme.primary + '22', borderColor: theme.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  chipTextActive: { color: theme.primaryLight, fontWeight: '700' },

  // Experience level cards
  levelList: { width: '100%', gap: 8 },
  levelCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.surface, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: theme.border,
  },
  levelCardActive: { borderColor: theme.primary, backgroundColor: theme.primary + '12' },
  levelLabel: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 },
  levelSub: { fontSize: 12, color: theme.textMuted, lineHeight: 17 },

  // Category cards
  catList: { width: '100%', gap: 10 },
  catCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: theme.surface, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: theme.border,
  },
  catIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 },
  catDesc: { fontSize: 12, color: theme.textMuted },
  catUnchecked: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: theme.border },

  // Sticky footer
  stickyBottom: { position: 'absolute', bottom: 32, left: 24, right: 24 },

  // Summary
  summaryCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, padding: 18, gap: 12,
    borderWidth: 1, borderColor: 'rgba(201,160,220,0.18)', marginBottom: 36,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryText: { fontSize: 14, color: theme.textSecondary, flex: 1, fontWeight: '500' },

  // Buttons
  btn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  btnDisabled: { opacity: 0.38 },
  btnGrad: { paddingVertical: 17, alignItems: 'center', borderRadius: 14 },
  btnText: {
    fontSize: 16, fontWeight: '700', color: '#F5D5E0',
    fontFamily: theme.fonts.serif, letterSpacing: 0.3,
  },
});
