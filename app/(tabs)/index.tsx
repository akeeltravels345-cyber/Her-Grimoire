
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Animated, Easing } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, getCurrentMoonPhase } from '../../constants/theme';
import { getTodayPlanet } from '../../constants/planetaryData';
import { getCurrentPlanetaryHour, formatHourTime, PlanetaryHourInfo } from '../../services/planetaryHours';
import { useApp } from '../../contexts/AppContext';
import { getComputedStatus, getDaysUntil } from '../../services/mockData';
import { formatMonthLong, formatDateWithLongDay, formatShortDate } from '../../utils/dateHelpers';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

import StarField from '../../components/StarField';
import MoonVisual from '../../components/MoonVisual';
import PlanetVisual from '../../components/PlanetVisual';
import { resolveCategoryColor, resolveCategory } from '../../utils/categoryHelpers';
import SwipeableRow from '../../components/SwipeableRow';

function getMoonPhaseIndex(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const c = Math.floor(365.25 * year);
  const e = Math.floor(30.6 * month);
  const jd = c + e + day - 694039.09;
  const phase = jd / 29.53058867;
  return Math.round((phase - Math.floor(phase)) * 8) % 8;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { rituals, categories, categoryColors, manifestations, updateRitual, currentMonthIntention, coreCategories, monthlyStreak, standaloneEntries, monthlySnapshots } = useApp();
  const moonPhase = getCurrentMoonPhase();
  const moonPhaseIndex = getMoonPhaseIndex();
  const todayPlanet = getTodayPlanet();

  const [currentHour, setCurrentHour] = useState<PlanetaryHourInfo | null>(null);
  const [intentionBannerDismissed, setIntentionBannerDismissed] = useState(false);
  const [reviewBannerDismissed, setReviewBannerDismissed] = useState(false);
  const [newMonthCardDismissed, setNewMonthCardDismissed] = useState(false);

  useEffect(() => {
    const update = () => setCurrentHour(getCurrentPlanetaryHour());
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  // Force re-render when screen regains focus to show updated ritual statuses
  const [, setRefreshTrigger] = useState(0);
  useFocusEffect(
    React.useCallback(() => {
      setRefreshTrigger(t => t + 1); // Trigger re-render
    }, [])
  );

  // ── Monthly cycle banners ──
  const now_mc = new Date();
  const dayOfMonth_mc = now_mc.getDate();
  const currentMonthStr_mc = `${now_mc.getFullYear()}-${String(now_mc.getMonth() + 1).padStart(2, '0')}`;
  const daysInMonth_mc = new Date(now_mc.getFullYear(), now_mc.getMonth() + 1, 0).getDate();
  const needsIntention = !currentMonthIntention.intentionSet || currentMonthIntention.month !== currentMonthStr_mc;

  // Day 1: invitation card (replaces hard redirect)
  const showNewMonthCard = useMemo(() => {
    if (newMonthCardDismissed) return false;
    return dayOfMonth_mc === 1 && needsIntention;
  }, [newMonthCardDismissed, needsIntention, dayOfMonth_mc]);

  // Days 2–3: gentle reminder banner
  const showIntentionBanner = useMemo(() => {
    if (intentionBannerDismissed) return false;
    return (dayOfMonth_mc === 2 || dayOfMonth_mc === 3) && needsIntention;
  }, [intentionBannerDismissed, needsIntention, dayOfMonth_mc]);

  // Days 27–end: chapter-closing banner
  const showReviewBanner = useMemo(() => {
    if (reviewBannerDismissed) return false;
    // Don't show if month-review is already complete (reflection exists)
    const monthSnapshot = monthlySnapshots.find(s => s.month === currentMonthStr_mc);
    if (monthSnapshot && monthSnapshot.reflection) return false;
    return dayOfMonth_mc >= daysInMonth_mc - 3;
  }, [reviewBannerDismissed, dayOfMonth_mc, daysInMonth_mc, monthlySnapshots, currentMonthStr_mc]);

  const intentionMonthName = useMemo(() => {
    return formatMonthLong(new Date());
  }, []);

  const overdueRituals = useMemo(() => {
    return rituals
      .map(r => ({ ...r, computedStatus: getComputedStatus(r) }))
      .filter(r => r.computedStatus === 'overdue')
      .sort((a, b) => {
        const da = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Infinity;
        const db = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Infinity;
        return da - db;
      });
  }, [rituals]);

  // ═══ Monthly Snapshot Data ═══
  const monthlyData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysRemaining = daysInMonth - dayOfMonth;
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    const monthName = formatMonthLong(now);

    const monthRituals = rituals.filter(r => {
      if (!r.scheduledDate) return false;
      const d = new Date(r.scheduledDate);
      return d >= monthStart && d <= monthEnd;
    });

    const completed = monthRituals.filter(r => r.status === 'completed').length;
    const total = monthRituals.length;
    const missed = monthRituals.filter(r => {
      if (r.status === 'completed' || r.status === 'dismissed') return false;
      if (!r.scheduledDate) return false;
      return new Date(r.scheduledDate) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }).length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const warningLevel: 'none' | 'soft' | 'amber' | 'red' =
      dayOfMonth <= 7 ? 'none' : dayOfMonth <= 14 ? 'soft' : dayOfMonth <= 21 ? 'amber' : 'red';

    const coreCatData = coreCategories.map(catId => {
      const cat = categories.find(c => c.id === catId);
      const catColor = resolveCategoryColor(catId, categoryColors, categories);
      const catRituals = monthRituals.filter(r => r.category === catId);
      const scheduledCount = catRituals.length;
      const completedCount = catRituals.filter(r => r.status === 'completed').length;

      let lastPerformed: string | null = null;
      const allCatRituals = rituals.filter(r => r.category === catId && r.lastPerformed);
      if (allCatRituals.length > 0) {
        const dates = allCatRituals.map(r => new Date(r.lastPerformed!).getTime());
        const recentDate = new Date(Math.max(...dates));
        const daysAgo = Math.floor((now.getTime() - recentDate.getTime()) / (24 * 60 * 60 * 1000));
        lastPerformed = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
      }

      return {
        catId,
        name: cat?.name || catId,
        icon: cat?.icon || 'auto-fix-high',
        color: catColor,
        scheduledCount,
        completedCount,
        lastPerformed,
        pct: scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0,
      };
    });

    const manifestedCount = manifestations.filter(m => m.status === 'spilled').length;

    return { monthName, daysRemaining, daysInMonth, completed, total, missed, completionPct, warningLevel, coreCatData, manifestedCount };
  }, [rituals, categories, categoryColors, coreCategories, manifestations]);



  const todayRituals = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return rituals.filter(r => {
      if (!r.scheduledDate) return false;
      const d = r.scheduledDate.slice(0, 10);
      return d === todayStr && r.status !== 'completed' && r.status !== 'dismissed';
    });
  }, [rituals]);

  const recentEntries = useMemo(() => {
    type ActivityEntry = {
      id: string; ritualName: string; ritualId?: string; category?: string;
      date: string; notes: string; mood: string; isStandalone?: boolean; title?: string;
    };
    const entries: ActivityEntry[] = [];
    rituals.forEach(r => {
      r.journal.forEach(j => {
        entries.push({ ...j, ritualName: r.name, ritualId: r.id, category: r.category });
      });
    });
    standaloneEntries.forEach(e => {
      entries.push({
        id: e.id, ritualName: e.title || e.type, ritualId: undefined,
        category: undefined, date: e.date, notes: e.notes,
        mood: e.mood || '', isStandalone: true, title: e.title,
      });
    });
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);
  }, [rituals, standaloneEntries]);

  const todayStr = formatDateWithLongDay(new Date());
  const greeting = getGreeting();

  function getOverduePill(days: number): string {
    if (days === -1) return '1d overdue';
    return `${Math.abs(days)}d overdue`;
  }

  // Memoized overdue ritual item component
  const OverdueRitualItem = React.memo(({ ritual }: { ritual: any }) => {
    const cat = resolveCategory(ritual.category, categories);
    const catColor = resolveCategoryColor(ritual.category, categoryColors, categories);
    const days = ritual.scheduledDate ? getDaysUntil(ritual.scheduledDate) : null;

    return (
      <SwipeableRow key={ritual.id} onDelete={() => updateRitual(ritual.id, { status: 'dismissed' as any, scheduledDate: undefined })}>
        <Pressable
          style={styles.alertBanner}
          onPress={() => router.push(`/ritual/${ritual.id}`)}
        >
          <View style={[styles.alertIcon, { backgroundColor: catColor + '20' }]}>
            <MaterialIcons
              name={(cat?.icon || 'auto-fix-high') as keyof typeof MaterialIcons.glyphMap}
              size={18}
              color={catColor}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertName} numberOfLines={1}>{ritual.name}</Text>
            {ritual.intention ? <Text style={styles.alertIntention} numberOfLines={1}>{ritual.intention}</Text> : null}
          </View>
          {days !== null ? (
            <View style={styles.alertDatePill}>
              <Text style={styles.alertDateText}>{getOverduePill(days)}</Text>
            </View>
          ) : null}
        </Pressable>
      </SwipeableRow>
    );
  });

  OverdueRitualItem.displayName = 'OverdueRitualItem';

  // Memoized today ritual item component
  const TodayRitualItem = React.memo(({ ritual }: { ritual: any }) => {
    const cat = resolveCategory(ritual.category, categories);
    const catColor = resolveCategoryColor(ritual.category, categoryColors, categories);

    return (
      <Pressable key={ritual.id} style={styles.todayCard} onPress={() => router.push(`/ritual/${ritual.id}`)}>
        <View style={[styles.todayCatBar, { backgroundColor: catColor }]} />
        <View style={[styles.todayIcon, { backgroundColor: catColor + '22' }]}>
          <MaterialIcons name={(cat?.icon || 'auto-fix-high') as keyof typeof MaterialIcons.glyphMap} size={18} color={catColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.todayName} numberOfLines={1}>{ritual.name}</Text>
          {ritual.intention ? (
            <Text style={styles.todayIntention} numberOfLines={1}>{ritual.intention}</Text>
          ) : null}
        </View>
        <Pressable
          style={[styles.todayCompleteBtn, { borderColor: catColor + '60' }]}
          onPress={() => router.push({ pathname: '/log-ritual', params: { ritualId: ritual.id } } as any)}
          hitSlop={6}
        >
          <MaterialIcons name="check" size={15} color={catColor} />
          <Text style={[styles.todayCompleteBtnText, { color: catColor }]}>Complete</Text>
        </Pressable>
      </Pressable>
    );
  });

  TodayRitualItem.displayName = 'TodayRitualItem';

  return (
    <LinearGradient
      colors={['#4A2875', '#3A1F65', '#2D1855', '#231245', '#1C0E3A']}
      locations={[0, 0.2, 0.45, 0.7, 1]}
      start={{ x: 0.25, y: 0 }}
      end={{ x: 0.75, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={['top']} style={styles.container}>
        {/* Atmospheric colour wash overlay */}
        <LinearGradient
          colors={['rgba(150,80,180,0.15)', 'rgba(100,60,160,0.06)', 'rgba(80,50,150,0.08)', 'rgba(102,103,171,0.12)']}
locations={[0, 0.35, 0.65, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
          pointerEvents="none"
        />
        {/* Top highlight */}
        <LinearGradient
          colors={['rgba(180,120,220,0.12)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%' as any, zIndex: 0 }}
          pointerEvents="none"
        />
        {/* Bottom vignette */}
        <LinearGradient
          colors={['transparent', 'rgba(20,10,40,0.5)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%' as any, zIndex: 0 }}
          pointerEvents="none"
        />
        <StarField starCount={80} showShootingStar={true} />

        <ScrollView
          style={{ flex: 1, zIndex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.dateText}>{todayStr}</Text>
              <Text style={styles.greeting}>{greeting}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => router.push('/write-journal' as any)} style={styles.profileButton}>
                <MaterialIcons name="edit-note" size={18} color={theme.textSecondary} />
              </Pressable>
              <Pressable onPress={() => router.push('/add-ritual')} style={styles.addButton}>
                <LinearGradient
                  colors={[theme.primary, theme.primaryDark]}
                  style={styles.addButtonGradient}
                >
                  <MaterialIcons name="add" size={20} color={theme.background} />
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => router.push('/profile')} style={styles.profileButton}>
                <MaterialIcons name="person" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* ═══ DAY 1: NEW MONTH INVITATION ═══ */}
          {showNewMonthCard ? (
            <Pressable
              style={styles.newMonthCard}
              onPress={() => router.push('/monthly-intention' as any)}
            >
              <LinearGradient
                colors={[theme.primary + '30', theme.primary + '10']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Pressable
                style={styles.newMonthClose}
                onPress={(e) => { e.stopPropagation?.(); setNewMonthCardDismissed(true); }}
                hitSlop={12}
              >
                <MaterialIcons name="close" size={14} color={theme.textMuted} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.newMonthEyebrow}>A NEW CHAPTER BEGINS</Text>
                <Text style={styles.newMonthTitle}>Welcome to {intentionMonthName}</Text>
                <Text style={styles.newMonthSub}>Set your intention and plan your month</Text>
              </View>
              <View style={styles.newMonthArrow}>
                <MaterialIcons name="arrow-forward" size={20} color={theme.primary} />
              </View>
            </Pressable>
          ) : null}

          {/* ═══ END OF MONTH: CHAPTER CLOSING BANNER ═══ */}
          {showReviewBanner ? (
            <Pressable
              style={styles.reviewBanner}
              onPress={() => router.push('/month-review' as any)}
            >
              <Text style={styles.reviewBannerIcon}>🌘</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewBannerTitle}>This chapter is closing</Text>
                <Text style={styles.reviewBannerSub}>Reflect on {intentionMonthName} before it passes →</Text>
              </View>
              <Pressable
                style={styles.intentionBannerClose}
                onPress={(e) => { e.stopPropagation?.(); setReviewBannerDismissed(true); }}
                hitSlop={12}
              >
                <MaterialIcons name="close" size={16} color={theme.textMuted} />
              </Pressable>
            </Pressable>
          ) : null}

          {/* ═══ DAYS 2–3: MONTHLY INTENTION BANNER ═══ */}
          {showIntentionBanner ? (
            <Pressable
              style={styles.intentionBanner}
              onPress={() => router.push('/monthly-intention')}
            >
              <View style={styles.intentionBannerContent}>
                <Text style={styles.intentionBannerIcon}>✦</Text>
                <Text style={styles.intentionBannerText}>
                  Set your {intentionMonthName} intention →
                </Text>
              </View>
              <Pressable
                style={styles.intentionBannerClose}
                onPress={(e) => {
                  e.stopPropagation?.();
                  setIntentionBannerDismissed(true);
                }}
                hitSlop={12}
              >
                <MaterialIcons name="close" size={16} color={theme.textMuted} />
              </Pressable>
            </Pressable>
          ) : null}

          {/* ═══ COSMIC CONTEXT — Square Cards ═══ */}
          <View style={styles.cosmicGrid}>
            <Pressable
              style={[styles.planetCard, { borderColor: todayPlanet.color + '25', borderTopColor: 'rgba(255,255,255,0.15)' }]}
              onPress={() => router.push('/(tabs)/planetary')}
            >
              <View style={styles.planetCardTop}>
                <View style={styles.planetVisualWrap}>
                  <PlanetVisual planetKey={todayPlanet.key} size={38} showGlow={false} />
                </View>
                <View style={[styles.planetDayBadge, { backgroundColor: todayPlanet.color + '33' }]}>
                  <Text style={[styles.planetDayBadgeText, { color: todayPlanet.color }]}>{todayPlanet.day}</Text>
                </View>
              </View>
              <Text style={[styles.planetCardTitle, { color: todayPlanet.color }]}>Day of {todayPlanet.name}</Text>
              <View style={styles.planetWorkingsWrap}>
                {todayPlanet.bestWorkings.slice(0, 4).map((w, i) => (
                  <View key={i} style={[styles.planetWorkingChip, { backgroundColor: todayPlanet.color + '28' }]}>
                    <Text style={[styles.planetWorkingText, { color: todayPlanet.color }]}>{w}</Text>
                  </View>
                ))}
              </View>
              {currentHour ? (
                <View style={styles.planetHourRow}>
                  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
                    <PlanetVisual planetKey={currentHour.planet.key} size={16} showGlow={false} />
                  </View>
                  <Text style={styles.planetHourText}>
                    {currentHour.planet.name} hour · {formatHourTime(currentHour.startTime)}
                  </Text>
                </View>
              ) : null}
            </Pressable>

            <Pressable style={styles.moonCard} onPress={() => router.push({ pathname: '/(tabs)/planetary', params: { tab: 'moon' } })}>
              <View style={styles.moonVisualWrap}>
                <MoonVisual phaseIndex={moonPhaseIndex} size={62} />
              </View>
              <Text style={styles.moonPhaseName}>{moonPhase.name}</Text>
              <Text style={styles.moonEnergy} numberOfLines={2}>{moonPhase.energy}</Text>
            </Pressable>
          </View>

          {/* ═══ OVERDUE ALERTS ═══ */}
          {overdueRituals.length > 0 ? (
            <View style={styles.alertsSection}>
              <View style={styles.alertsHeader}>
                <MaterialIcons name="error-outline" size={16} color={theme.error} />
                <Text style={styles.alertsTitle}>{overdueRituals.length} Past Due</Text>
              </View>
              {overdueRituals.map(r => <OverdueRitualItem key={r.id} ritual={r} />)}
            </View>
          ) : null}

          {/* ═══ TODAY'S PRACTICE ═══ */}
          {todayRituals.length > 0 ? (
            <View style={styles.todaySection}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.sectionTitle}>Today's Rituals</Text>
                  <View style={styles.todayCountBadge}>
                    <Text style={styles.todayCountText}>{todayRituals.length}</Text>
                  </View>
                </View>
              </View>
              {todayRituals.map(r => <TodayRitualItem key={r.id} ritual={r} />)}
            </View>
          ) : null}

          {/* ═══ MONTHLY SNAPSHOT ═══ */}
          <MonthlySnapshotCard
            data={monthlyData}
            monthlyStreak={monthlyStreak}
            currentMonthIntention={currentMonthIntention}
          />

          {/* ═══ RECENT ACTIVITY ═══ */}
          {recentEntries.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <Pressable onPress={() => router.push('/(tabs)/journal')}>
                  <Text style={styles.seeAll}>See all →</Text>
                </Pressable>
              </View>
              {recentEntries.map(entry => {
                const catColor = entry.category
                  ? resolveCategoryColor(entry.category, categoryColors, categories)
                  : theme.primary;
                const handlePress = () => {
                  if (entry.isStandalone) {
                    router.push({ pathname: '/journal-entry/[id]', params: { id: entry.id } } as any);
                  } else if (entry.ritualId) {
                    router.push({ pathname: '/journal-entry/[id]', params: { id: entry.id, ritualId: entry.ritualId } } as any);
                  }
                };
                return (
                  <Pressable key={entry.id} style={styles.activityCard} onPress={handlePress}>
                    <View style={[styles.activityDot, { backgroundColor: catColor }]} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text style={styles.activityRitual} numberOfLines={1}>{entry.ritualName}</Text>
                        {entry.isStandalone ? (
                          <View style={styles.activityStandalonePill}>
                            <Text style={styles.activityStandalonePillText}>Personal</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.activityNotes} numberOfLines={2}>{entry.notes}</Text>
                      <View style={styles.activityMeta}>
                        <Text style={styles.activityDate}>
                          {formatShortDate(entry.date)}
                        </Text>
                        {entry.mood ? (
                          <View style={styles.activityMoodBadge}>
                            <Text style={styles.activityMood}>{entry.mood}</Text>
                          </View>
                        ) : null}
                        <MaterialIcons name="chevron-right" size={14} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ═══ PULSING BORDER for urgent core categories ═══
function PulsingCoreCatRow({ children }: { children: React.ReactNode }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, []);
  const borderColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(232,136,152,0.15)', 'rgba(232,136,152,0.5)'],
  });
  return (
    <Animated.View style={[msStyles.coreCatRow, msStyles.coreCatRowRed, { borderColor }]}>
      {children}
    </Animated.View>
  );
}

// ═══ ANIMATED PROGRESS BAR ═══
function AnimatedProgressBar({ progress, color, delayMs = 0, isGradient = false }: {
  progress: number; color: string; delayMs?: number; isGradient?: boolean;
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  const barWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (containerWidth > 0) {
      const target = Math.max((progress / 100) * containerWidth, progress > 0 ? 3 : 0);
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(barWidth, { toValue: target, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      ]).start();
    }
  }, [progress, containerWidth]);
  return (
    <View
      style={isGradient ? msStyles.completionBarBg : msStyles.coreCatBarBg}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {isGradient ? (
        <Animated.View style={[{ height: 8, borderRadius: 4, overflow: 'hidden' }, { width: barWidth }]}>
          <LinearGradient
            colors={[theme.primaryDark, theme.primary, '#DFC4EB']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1, borderRadius: 4 }}
          />
        </Animated.View>
      ) : (
        <Animated.View style={[msStyles.coreCatBarFill, { backgroundColor: color }, { width: barWidth }]} />
      )}
    </View>
  );
}

// ═══ MONTHLY SNAPSHOT CARD ═══
interface MonthlySnapshotProps {
  data: {
    monthName: string;
    daysRemaining: number;
    completed: number;
    total: number;
    missed: number;
    completionPct: number;
    warningLevel: 'none' | 'soft' | 'amber' | 'red';
    coreCatData: {
      catId: string; name: string; icon: string; color: string;
      scheduledCount: number; completedCount: number;
      lastPerformed: string | null; pct: number;
    }[];
    manifestedCount: number;
  };
  monthlyStreak: number;
  currentMonthIntention: { intention: string; ritualIntention: string; intentionSet: boolean; month: string };
}

function MonthlySnapshotCard({ data, monthlyStreak, currentMonthIntention }: MonthlySnapshotProps) {
  const router = useRouter();
  const { monthName, daysRemaining, completed, total, missed, completionPct, warningLevel, coreCatData, manifestedCount } = data;

  return (
    <View style={msStyles.card}>
      {/* Top glow */}
      <LinearGradient
        colors={[theme.primary + '20', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={msStyles.cardTopGlow}
        pointerEvents="none"
      />

      {/* ═══ Header ═══ */}
      <View style={msStyles.header}>
        <View style={{ flex: 1 }}>
          <Text style={msStyles.headerTitle}>{monthName}&#39;s Practice</Text>
          <Text style={msStyles.headerSub}>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining</Text>
        </View>
        {monthlyStreak > 0 ? (
          <View style={msStyles.streakBadge}>
            <Text style={msStyles.streakText}>{"\uD83D\uDD25"} {monthlyStreak} month streak</Text>
          </View>
        ) : null}
      </View>

      {/* ═══ Completion Bar ═══ */}
      <View style={msStyles.completionSection}>
        <Text style={msStyles.completionLabel}>
          {completed} of {total} rituals completed
        </Text>
        <AnimatedProgressBar progress={completionPct} color={theme.primary} delayMs={200} isGradient />
        <Text style={msStyles.completionSub}>
          {missed} missed {"\u00B7"} {daysRemaining} days to go
        </Text>
      </View>

      {/* ═══ Core Practice ═══ */}
      <View style={msStyles.coreDivider}>
        <View style={msStyles.coreDividerLine} />
        <Text style={msStyles.coreDividerText}>CORE PRACTICE</Text>
        <View style={msStyles.coreDividerLine} />
      </View>

      {coreCatData.map((cat, i) => {
        const isCompleted = cat.completedCount > 0;
        const isScheduled = cat.scheduledCount > 0 && cat.completedCount === 0;
        const notScheduled = cat.scheduledCount === 0;

        // Determine row state
        let statusElement: React.ReactNode = null;
        let rowBg = cat.color + '08';
        let nameColor = theme.textPrimary;

        if (isCompleted) {
          statusElement = (
            <View style={[msStyles.coreCatStatus, { backgroundColor: theme.success + '18' }]}>
              <MaterialIcons name="check" size={12} color={theme.success} />
              <Text style={[msStyles.coreCatStatusText, { color: theme.success }]}>{cat.completedCount}/{cat.scheduledCount}</Text>
            </View>
          );
        } else if (isScheduled) {
          statusElement = (
            <Text style={[msStyles.coreCatCount, { color: cat.color }]}>0/{cat.scheduledCount}</Text>
          );
        } else if (notScheduled && warningLevel === 'none') {
          statusElement = <Text style={msStyles.coreCatNeutral}>{"\u2014"}</Text>;
          rowBg = 'rgba(255,255,255,0.04)';
          nameColor = theme.textMuted;
        } else if (notScheduled && warningLevel === 'soft') {
          statusElement = <Text style={msStyles.coreCatSoftHint}>Not scheduled yet</Text>;
          rowBg = 'rgba(78,168,222,0.06)';
        } else if (notScheduled && warningLevel === 'amber') {
          statusElement = (
            <Pressable onPress={() => router.push(`/add-ritual?category=${encodeURIComponent(cat.catId)}`)} hitSlop={8}>
              <Text style={msStyles.coreCatAmberCta}>Schedule soon {"\u2192"}</Text>
            </Pressable>
          );
          rowBg = 'rgba(232,200,122,0.08)';
          nameColor = theme.warning;
        }

        // Red urgent gets pulsing wrapper
        if (notScheduled && warningLevel === 'red') {
          return (
            <PulsingCoreCatRow key={cat.catId}>
              <Pressable style={msStyles.coreCatRowInner} onPress={() => router.push('/(tabs)/rituals')}>
                <View style={[msStyles.coreCatIcon, { backgroundColor: theme.error + '18' }]}>
                  <MaterialIcons name={cat.icon as keyof typeof MaterialIcons.glyphMap} size={15} color={theme.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[msStyles.coreCatName, { color: theme.error }]}>{cat.name}</Text>
                  {cat.lastPerformed ? <Text style={msStyles.coreCatLast}>{cat.lastPerformed}</Text> : null}
                </View>
                <Pressable onPress={() => router.push(`/add-ritual?category=${encodeURIComponent(cat.catId)}`)} hitSlop={8}>
                  <Text style={msStyles.coreCatRedCta}>Schedule now {"\u2192"}</Text>
                </Pressable>
              </Pressable>
            </PulsingCoreCatRow>
          );
        }

        return (
          <Pressable
            key={cat.catId}
            style={[msStyles.coreCatRow, { backgroundColor: rowBg }]}
            onPress={() => router.push('/(tabs)/rituals')}
          >
            <View style={msStyles.coreCatRowInner}>
              <View style={[msStyles.coreCatIcon, { backgroundColor: cat.color + '1A' }]}>
                <MaterialIcons name={cat.icon as keyof typeof MaterialIcons.glyphMap} size={15} color={isCompleted ? theme.success : cat.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[msStyles.coreCatName, { color: nameColor }]}>{cat.name}</Text>
                {cat.lastPerformed ? <Text style={msStyles.coreCatLast}>{cat.lastPerformed}</Text> : null}
              </View>
              {statusElement}
            </View>
            {cat.scheduledCount > 0 ? (
              <AnimatedProgressBar
                progress={cat.pct}
                color={isCompleted ? theme.success : cat.color}
                delayMs={300 + i * 100}
              />
            ) : null}
          </Pressable>
        );
      })}

      {/* ═══ Monthly Intention Teaser ═══ */}
      {currentMonthIntention.intentionSet ? (
        <Pressable style={msStyles.intentionTeaser} onPress={() => router.push('/monthly-intention')}>
          <Text style={msStyles.intentionTeaserLabel}>This month&#39;s intention</Text>
          <Text style={msStyles.intentionTeaserText} numberOfLines={2}>{currentMonthIntention.intention}</Text>
        </Pressable>
      ) : null}

      {/* ═══ Footer Stats ═══ */}
      <View style={msStyles.footer}>
        <Pressable
          style={msStyles.footerItem}
          onPress={() => router.push('/(tabs)/rituals')}
          hitSlop={8}
        >
          <Text style={[msStyles.footerValue, { color: theme.success }]}>{completed}</Text>
          <Text style={msStyles.footerLabel}>Completed</Text>
        </Pressable>
        <View style={msStyles.footerDivider} />
        <Pressable
          style={msStyles.footerItem}
          onPress={() => router.push('/(tabs)/rituals')}
          hitSlop={8}
        >
          <Text style={[msStyles.footerValue, { color: missed > 0 ? theme.error : theme.textMuted }]}>{missed}</Text>
          <Text style={msStyles.footerLabel}>Missed</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ═══ Monthly Snapshot Styles ═══
const msStyles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
    borderTopColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  cardTopGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 60,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18,
  },
  headerTitle: {
    fontSize: 20, fontWeight: '700', color: theme.textPrimary,
    fontFamily: theme.fonts.serif,
  },
  headerSub: {
    fontSize: 12, color: theme.textMuted, fontWeight: '500', marginTop: 3,
  },
  streakBadge: {
    backgroundColor: 'rgba(232,200,122,0.12)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(232,200,122,0.25)',
  },
  streakText: {
    fontSize: 11, fontWeight: '700', color: '#E8C87A',
  },
  // Completion
  completionSection: { marginBottom: 16 },
  completionLabel: {
    fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 8,
  },

  completionBarBg: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden',
  },
  completionSub: {
    fontSize: 11, color: theme.textMuted, fontWeight: '500', marginTop: 6,
  },
  // Core divider
  coreDivider: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  coreDividerLine: {
    flex: 1, height: 1, backgroundColor: theme.border,
  },
  coreDividerText: {
    fontSize: 9, fontWeight: '700', color: theme.textMuted, letterSpacing: 1.2,
  },
  // Core category rows
  coreCatRow: {
    borderRadius: 12, padding: 12, marginBottom: 7,
    borderWidth: 1, borderColor: 'transparent',
  },
  coreCatRowRed: {
    backgroundColor: 'rgba(232,136,152,0.06)',
    borderWidth: 1.5,
  },
  coreCatRowInner: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6,
  },
  coreCatIcon: {
    width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  coreCatName: {
    fontSize: 13, fontWeight: '600', color: theme.textPrimary,
  },

  coreCatLast: {
    fontSize: 10, color: theme.textMuted, fontWeight: '500', marginTop: 1,
  },
  coreCatBarBg: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden',
  },
  coreCatBarFill: {
    height: 4, borderRadius: 2,
  },
  coreCatStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  coreCatStatusText: { fontSize: 11, fontWeight: '700' },
  coreCatCount: { fontSize: 12, fontWeight: '700' },
  coreCatNeutral: { fontSize: 12, color: theme.textMuted },
  coreCatSoftHint: { fontSize: 11, color: '#4EA8DE', fontWeight: '600', fontStyle: 'italic' },
  coreCatAmberCta: { fontSize: 11, fontWeight: '700', color: theme.warning },
  coreCatRedCta: { fontSize: 11, fontWeight: '700', color: theme.error },
  // Intention teaser
  intentionTeaser: {
    marginTop: 10, padding: 14, borderRadius: theme.radius.md,
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)',
  },
  intentionTeaserLabel: {
    fontSize: 9, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5,
  },
  intentionTeaserText: {
    fontSize: 14, color: '#F5D5E0', fontStyle: 'italic', lineHeight: 20,
    fontFamily: theme.fonts.serif,
  },
  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.border,
  },
  footerItem: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  footerValue: { fontSize: 18, fontWeight: '700' },

  footerLabel: {
    fontSize: 9, fontWeight: '600', color: theme.textMuted,
    textTransform: 'uppercase', marginTop: 2, letterSpacing: 0.3,
  },
  footerDivider: { width: 1, height: 24, backgroundColor: theme.border },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 16 },
  dateText: { fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
  greeting: {
    fontSize: 24, fontWeight: '700', color: theme.textPrimary, marginTop: 2,
    textShadowColor: 'rgba(245,213,224,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  addButton: {
    width: 36, height: 36, borderRadius: 18, overflow: 'hidden',
  },
  addButtonGradient: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  profileButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },

  // ═══ Cosmic Grid — Square Cards ═══
  cosmicGrid: {
    flexDirection: 'row', gap: 10, marginBottom: 16,
  },
  planetCard: {
    flex: 1.4, backgroundColor: theme.surface, borderRadius: theme.radius.lg,
    padding: 14, borderWidth: 1, borderColor: theme.border,
    justifyContent: 'space-between', minHeight: 155, overflow: 'hidden',
  },
  planetCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  planetVisualWrap: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  planetDayBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  planetDayBadgeText: { fontSize: 10, fontWeight: '700' },
  planetCardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  planetWorkingsWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8,
  },
  planetWorkingChip: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  planetWorkingText: { fontSize: 10, fontWeight: '600' },
  planetHourRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingTop: 6, borderTopWidth: 1, borderTopColor: theme.border,
  },
  planetHourText: { fontSize: 11, fontWeight: '500', color: theme.textSecondary },

  moonCard: {
    flex: 1, backgroundColor: theme.surface, borderRadius: theme.radius.lg,
    padding: 14, alignItems: 'center', justifyContent: 'center',
    minHeight: 155, borderWidth: 1, borderColor: theme.border,
    overflow: 'hidden',
  },
  moonVisualWrap: {
    marginBottom: 6, height: 90, alignItems: 'center', justifyContent: 'center',
  },
  moonPhaseName: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', marginBottom: 4 },
  moonEnergy: { fontSize: 10, fontWeight: '500', color: theme.textSecondary, textAlign: 'center', lineHeight: 14 },

  // ═══ Alerts — overdue only ═══
  alertsSection: { marginBottom: 16 },
  alertsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  alertsTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.error },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.error + '08', borderRadius: theme.radius.md,
    padding: 12, marginBottom: 6,
    borderLeftWidth: 3, borderLeftColor: theme.error,
  },
  alertIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  alertName: { fontSize: 13, fontWeight: '700', color: theme.error, marginBottom: 1 },
  alertIntention: { fontSize: 11, color: theme.textSecondary, fontStyle: 'italic' },
  alertDatePill: {
    backgroundColor: theme.error + '18', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, marginLeft: 4,
  },
  alertDateText: { fontSize: 10, fontWeight: '700', color: theme.error },



  // ═══ Sections ═══
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },

  seeAll: { fontSize: 14, fontWeight: '600', color: theme.primary },

  // ═══ Activity ═══
  activityCard: {
    flexDirection: 'row', backgroundColor: theme.surface, borderRadius: theme.radius.md,
    padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: theme.border,
    overflow: 'hidden',
  },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  activityRitual: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, marginBottom: 3 },
  activityNotes: { fontSize: 13, color: theme.textSecondary, lineHeight: 18, marginBottom: 6, fontFamily: theme.fonts.serif, fontStyle: 'italic' as const },
  activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activityDate: { fontSize: 12, color: theme.textMuted },
  activityMoodBadge: { backgroundColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  activityMood: { fontSize: 11, color: theme.textSecondary, fontWeight: '500' },

  // ═══ Today's Rituals ═══
  todaySection: { marginBottom: 16 },
  todayCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface,
    borderRadius: theme.radius.md, paddingVertical: 12, paddingRight: 12,
    marginBottom: 8, gap: 10, borderWidth: 1, borderColor: theme.border,
    overflow: 'hidden',
  },
  todayCatBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, marginRight: 2 },
  todayIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  todayName: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  todayIntention: { fontSize: 11, color: theme.textMuted, fontStyle: 'italic', marginTop: 1 },
  todayCompleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, backgroundColor: 'transparent',
  },
  todayCompleteBtnText: { fontSize: 11, fontWeight: '700' },
  todayCountBadge: {
    backgroundColor: theme.primary + '30', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10,
  },
  todayCountText: { fontSize: 11, fontWeight: '700', color: theme.primary },

  // ═══ Activity standalone pill ═══
  activityStandalonePill: {
    backgroundColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  activityStandalonePillText: { fontSize: 9, fontWeight: '600', color: theme.textMuted, letterSpacing: 0.3 },

  // ═══ New Month Card ═══
  newMonthCard: {
    borderRadius: theme.radius.lg, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: theme.primary + '40',
    overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  newMonthEyebrow: { fontSize: 9, fontWeight: '700', color: theme.primary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  newMonthTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, fontFamily: theme.fonts.serif, marginBottom: 3 },
  newMonthSub: { fontSize: 12, color: theme.textSecondary },
  newMonthArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center' },
  newMonthClose: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  // ═══ Review Banner ═══
  reviewBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(201,168,76,0.10)',
    borderRadius: theme.radius.md, paddingVertical: 14, paddingHorizontal: 14,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
    borderLeftWidth: 3, borderLeftColor: '#C9A84C',
  },
  reviewBannerIcon: { fontSize: 20 },
  reviewBannerTitle: { fontSize: 14, fontWeight: '700', color: '#C9A84C' },
  reviewBannerSub: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },

  // Monthly Intention Banner
  intentionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    borderLeftWidth: 3,
    borderLeftColor: '#C9A84C',
  },
  intentionBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  intentionBannerIcon: {
    fontSize: 16,
    color: '#C9A84C',
  },
  intentionBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9A84C',
    flex: 1,
  },
  intentionBannerClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
