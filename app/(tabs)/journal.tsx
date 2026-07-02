import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';
import GradientScreen from '../../components/GradientScreen';
import { useApp } from '../../contexts/AppContext';
import { useAlert } from '@/template';
import { getRecentActivity } from '../../services/mockData';
import SwipeableRow from '../../components/SwipeableRow';
import { formatMonthYear, formatDateWithLongDay } from '../../utils/dateHelpers';

const MOOD_COLORS: Record<string, string> = {
  Empowered: '#7B337E', Aligned: '#5EBDAA', Renewed: '#6667AB',
  Elevated: '#C9847A', Balanced: '#5EBD8A', Connected: '#6667AB',
  Transformed: '#8B5CF6', Inspired: '#C9A84C', Grounded: '#5EBD8A',
  Amazed: '#F59E0B', Peaceful: '#5EBD8A',
};

const TYPE_COLORS: Record<string, string> = {
  reflection: '#5EBDAA', dream: '#6667AB', encounter: '#C9847A',
  insight: '#C9A84C', reminder: '#E85D6F',
};
const getTypeColor = (type?: string) => TYPE_COLORS[type || ''] || theme.accent;

type JournalTab = 'all' | 'rituals' | 'personal';
type ViewMode = 'timeline' | 'calendar';

// ─── Calendar strip component ─────────────────────────────────────────────────
function CalendarView({ entryDates }: { entryDates: string[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

  // Set of day-of-month numbers that have entries
  const filledDays = new Set<number>();
  entryDates.forEach(d => {
    const date = new Date(d);
    if (date.getFullYear() === year && date.getMonth() === month) {
      filledDays.add(date.getDate());
    }
  });

  // Current streak: consecutive days going back from today
  let streak = 0;
  for (let i = now.getDate(); i >= 1; i--) {
    if (filledDays.has(i)) streak++;
    else break;
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthName = formatMonthYear(now);

  // Build cell array: nulls for padding + day numbers
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={calStyles.container}>
      <View style={calStyles.headerRow}>
        <Text style={calStyles.monthLabel}>{monthName}</Text>
        {streak > 0 && (
          <View style={calStyles.streakPill}>
            <Text style={{ fontSize: 13 }}>🔥</Text>
            <Text style={calStyles.streakText}>{streak} day{streak !== 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>
      <View style={calStyles.dayLabels}>
        {dayLabels.map((d, i) => (
          <Text key={i} style={calStyles.dayLabel}>{d}</Text>
        ))}
      </View>
      <View style={calStyles.grid}>
        {cells.map((day, i) => {
          const isToday = day === now.getDate();
          const hasDot = day !== null && filledDays.has(day);
          return (
            <View key={i} style={calStyles.cell}>
              {day !== null ? (
                <View style={[
                  calStyles.dayCircle,
                  hasDot && calStyles.dayCircleFilled,
                  isToday && !hasDot && calStyles.dayCircleToday,
                ]}>
                  <Text style={[
                    calStyles.dayNum,
                    hasDot && calStyles.dayNumFilled,
                    isToday && !hasDot && { color: theme.primary, fontWeight: '700' },
                  ]}>{day}</Text>
                </View>
              ) : <View style={calStyles.cell} />}
            </View>
          );
        })}
      </View>
      <Text style={calStyles.calFooter}>
        {filledDays.size} of {daysInMonth} days journaled this month
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { rituals, categoryColors, standaloneEntries, deleteStandaloneEntry, journalEntryTypes } = useApp();
  const { showAlert } = useAlert();

  const ritualEntries = getRecentActivity(rituals);
  const [tab, setTab] = useState<JournalTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // ── Summary data ──────────────────────────────────────────────────────────
  const summaryData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const isThisMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };
    const dreamEntries = standaloneEntries.filter(e => e.type === 'dream');
    const dreamsThisMonth = dreamEntries.filter(e => isThisMonth(e.date)).length;
    const sorted = [...dreamEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDreamDate = sorted[0]?.date;
    const encounterEntries = standaloneEntries.filter(e => e.type === 'encounter');
    const encountersThisMonth = encounterEntries.filter(e => isThisMonth(e.date)).length;
    const sortedEnc = [...encounterEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastEncounterDate = sortedEnc[0]?.date;
    return { dreamsThisMonth, lastDreamDate, encountersThisMonth, lastEncounterDate };
  }, [standaloneEntries]);

  const formatLastDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff}d ago`;
  };

  // ── Timeline items ─────────────────────────────────────────────────────────
  type TimelineItem = {
    id: string; date: string; kind: 'ritual' | 'personal';
    title: string; notes: string; mood?: string;
    ritualId?: string; category?: string; type?: string; tags?: string[];
  };

  const allItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    if (tab === 'all' || tab === 'rituals') {
      ritualEntries.forEach(e => items.push({
        id: e.id, date: e.date, kind: 'ritual',
        title: e.ritualName, notes: e.notes,
        mood: e.mood, ritualId: e.ritualId, category: e.category,
      }));
    }
    if (tab === 'all' || tab === 'personal') {
      standaloneEntries.forEach(e => items.push({
        id: e.id, date: e.date, kind: 'personal',
        title: e.title, notes: e.notes,
        mood: e.mood, type: e.type, tags: e.tags,
      }));
    }
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ritualEntries, standaloneEntries, tab]);

  const displayItems = useMemo(() => {
    let items = allItems;
    if (typeFilter) items = items.filter(i => i.type === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.notes.toLowerCase().includes(q) ||
        i.tags?.some(t => t.toLowerCase().includes(q)) ||
        i.mood?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [allItems, typeFilter, searchQuery]);

  // All entry dates for calendar
  const allEntryDates = useMemo(() =>
    allItems.map(i => i.date),
    [allItems]
  );

  // Group by date for timeline
  const grouped = useMemo(() => {
    const g: Record<string, TimelineItem[]> = {};
    displayItems.forEach(item => {
      const key = formatDateWithLongDay(item.date);
      if (!g[key]) g[key] = [];
      g[key].push(item);
    });
    return Object.entries(g);
  }, [displayItems]);

  const getTypeIcon = (type?: string) => journalEntryTypes.find(et => et.id === type)?.icon || '📖';
  const getTypeLabel = (type?: string) => journalEntryTypes.find(et => et.id === type)?.label || 'Note';

  // ── Entry card ─────────────────────────────────────────────────────────────
  const renderCard = (item: TimelineItem) => {
    const catColor = item.category ? (categoryColors[item.category] || theme.accent) : theme.accent;
    const accentColor = item.kind === 'ritual' ? catColor : getTypeColor(item.type);
    const moodColor = MOOD_COLORS[item.mood || ''] || theme.accent;

    const card = (
      <Pressable
        style={[styles.entryCard, { borderLeftColor: accentColor }]}
        onPress={() => {
          Haptics.selectionAsync();
          if (item.kind === 'ritual' && item.ritualId) {
            router.push({ pathname: '/journal-entry/[id]' as any, params: { id: item.id, ritualId: item.ritualId } });
          } else {
            router.push({ pathname: '/journal-entry/[id]' as any, params: { id: item.id } });
          }
        }}
      >
        <View style={styles.entryTop}>
          {item.kind === 'ritual' ? (
            <View style={[styles.ritualDot, { backgroundColor: catColor }]} />
          ) : (
            <View style={[styles.typeIconWrap, { backgroundColor: accentColor + '20' }]}>
              <Text style={{ fontSize: 15 }}>{getTypeIcon(item.type)}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.entryTitle} numberOfLines={1}>{item.title}</Text>
            {item.kind === 'personal' && (
              <Text style={[styles.entryType, { color: accentColor }]}>{getTypeLabel(item.type)}</Text>
            )}
          </View>
          {item.mood ? (
            <View style={[styles.moodPill, { backgroundColor: moodColor + '20', borderColor: moodColor + '40' }]}>
              <Text style={[styles.moodPillText, { color: moodColor }]}>{item.mood}</Text>
            </View>
          ) : null}
          <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
        </View>
        <Text style={styles.entryPreview} numberOfLines={2}>{item.notes}</Text>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagRow}>
            {item.tags.slice(0, 3).map(tag => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    );

    if (item.kind === 'personal') {
      return (
        <SwipeableRow key={item.id} onDelete={() => { deleteStandaloneEntry(item.id); Haptics.selectionAsync(); }}>
          {card}
        </SwipeableRow>
      );
    }
    return <View key={item.id}>{card}</View>;
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (allItems.length === 0) {
    return (
      <GradientScreen>
        <View style={styles.header}>
          <Text style={styles.title}>Journal</Text>
          <Pressable style={styles.writeBtn} onPress={() => router.push('/write-journal')}>
            <MaterialIcons name="edit" size={18} color={theme.background} />
            <Text style={styles.writeBtnText}>Write</Text>
          </Pressable>
        </View>
        <View style={styles.emptyContainer}>
          <Image source={require('../../assets/images/journal-empty.png')} style={styles.emptyImage} contentFit="contain" />
          <Text style={styles.emptyTitle}>Your Journal Awaits</Text>
          <Text style={styles.emptyText}>Record your rituals, thoughts, dreams, and insights here.</Text>
          <Pressable style={styles.emptyCta} onPress={() => router.push('/write-journal')}>
            <MaterialIcons name="edit" size={18} color={theme.background} />
            <Text style={styles.emptyCtaText}>Write Entry</Text>
          </Pressable>
        </View>
      </GradientScreen>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <GradientScreen>
      {/* Header */}
      <View style={styles.header}>
        {showSearch ? (
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={18} color={theme.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search entries..."
              placeholderTextColor={theme.textMuted}
              autoFocus
              returnKeyType="search"
            />
            <Pressable onPress={() => { setShowSearch(false); setSearchQuery(''); }} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        ) : (
          <>
            <View>
              <Text style={styles.title}>Journal</Text>
              <Text style={styles.headerCount}>{displayItems.length} entries</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable style={styles.iconBtn} onPress={() => { setShowSearch(true); Haptics.selectionAsync(); }}>
                <MaterialIcons name="search" size={22} color={theme.textSecondary} />
              </Pressable>
              <Pressable
                style={[styles.iconBtn, viewMode === 'calendar' && styles.iconBtnActive]}
                onPress={() => { setViewMode(v => v === 'timeline' ? 'calendar' : 'timeline'); Haptics.selectionAsync(); }}
              >
                <MaterialIcons name="calendar-month" size={22} color={viewMode === 'calendar' ? theme.primary : theme.textSecondary} />
              </Pressable>
              <Pressable style={styles.writeBtn} onPress={() => { router.push('/write-journal'); Haptics.selectionAsync(); }}>
                <MaterialIcons name="edit" size={16} color={theme.background} />
                <Text style={styles.writeBtnText}>Write</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* Tab filters */}
      <View style={styles.tabRow}>
        {(['all', 'rituals', 'personal'] as JournalTab[]).map(t => (
          <Pressable
            key={t}
            style={[styles.tabChip, tab === t && styles.tabChipActive]}
            onPress={() => { setTab(t); setTypeFilter(null); Haptics.selectionAsync(); }}
          >
            {t === 'rituals' && <MaterialIcons name="menu-book" size={13} color={tab === t ? theme.textPrimary : theme.textMuted} />}
            {t === 'personal' && <MaterialIcons name="edit-note" size={13} color={tab === t ? theme.textPrimary : theme.textMuted} />}
            <Text style={[styles.tabChipText, tab === t && styles.tabChipTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
        {typeFilter && (
          <Pressable style={styles.typeFilterPill} onPress={() => setTypeFilter(null)}>
            <Text style={styles.typeFilterPillText}>{getTypeLabel(typeFilter)}</Text>
            <MaterialIcons name="close" size={12} color={theme.primary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Calendar view */}
        {viewMode === 'calendar' && (
          <CalendarView entryDates={allEntryDates} />
        )}

        {/* Summary cards */}
        {viewMode === 'timeline' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 10 }}>
            <Pressable style={[styles.summaryCard, { borderLeftColor: '#6667AB' }]} onPress={() => { setTab('personal'); setTypeFilter('dream'); }}>
              <View style={[styles.summaryIconBg, { backgroundColor: '#6667AB' + '15' }]}>
                <Text style={styles.summaryEmojiLarge}>🌙</Text>
              </View>
              <Text style={[styles.summaryNum, { color: '#6667AB' }]}>{summaryData.dreamsThisMonth}</Text>
              <Text style={styles.summaryLabel}>DREAMS</Text>
              <Text style={styles.summarySub}>Last: {formatLastDate(summaryData.lastDreamDate)}</Text>
            </Pressable>

            <Pressable style={[styles.summaryCard, { borderLeftColor: '#C9847A' }]} onPress={() => { setTab('personal'); setTypeFilter('encounter'); }}>
              <View style={[styles.summaryIconBg, { backgroundColor: '#C9847A' + '15' }]}>
                <Text style={styles.summaryEmojiLarge}>👁️</Text>
              </View>
              <Text style={[styles.summaryNum, { color: '#C9847A' }]}>{summaryData.encountersThisMonth}</Text>
              <Text style={styles.summaryLabel}>ENCOUNTERS</Text>
              <Text style={styles.summarySub}>Last: {formatLastDate(summaryData.lastEncounterDate)}</Text>
            </Pressable>

            <View style={[styles.summaryCard, { borderLeftColor: '#C9A84C' }]}>
              <View style={[styles.summaryIconBg, { backgroundColor: '#C9A84C' + '15' }]}>
                <MaterialIcons name="auto-stories" size={44} color="#C9A84C" />
              </View>
              <Text style={[styles.summaryNum, { color: '#C9A84C' }]}>{allItems.length}</Text>
              <Text style={styles.summaryLabel}>TOTAL</Text>
              <Text style={styles.summarySub}>{ritualEntries.length} ritual · {standaloneEntries.length} personal</Text>
            </View>
          </ScrollView>
        )}

        {/* Search empty state */}
        {searchQuery.trim().length > 0 && displayItems.length === 0 && (
          <View style={styles.searchEmpty}>
            <MaterialIcons name="search-off" size={40} color={theme.textMuted} />
            <Text style={styles.searchEmptyText}>No entries match "{searchQuery}"</Text>
          </View>
        )}

        {/* Timeline */}
        {viewMode === 'timeline' && grouped.map(([dateKey, items]) => (
          <View key={dateKey} style={styles.dateSection}>
            <View style={styles.dateDivider}>
              <View style={styles.dateDividerLine} />
              <Text style={styles.dateDividerText}>{dateKey}</Text>
              <View style={styles.dateDividerLine} />
            </View>
            {items.map(item => renderCard(item))}
          </View>
        ))}
      </ScrollView>

      {/* Floating write button */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => { router.push('/write-journal'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
      >
        <MaterialIcons name="edit" size={22} color={theme.background} />
      </Pressable>
    </GradientScreen>
  );
}

// ─── Calendar styles ───────────────────────────────────────────────────────────
const calStyles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface, borderRadius: 16,
    padding: 14, marginBottom: 20, borderWidth: 1, borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  monthLabel: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.primary + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16, borderWidth: 0.5, borderColor: theme.primary + '30' },
  streakText: { fontSize: 11, fontWeight: '600', color: theme.primary },
  dayLabels: { flexDirection: 'row', marginBottom: 8 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '600', color: theme.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 1 },
  dayCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayCircleFilled: { backgroundColor: theme.primary },
  dayCircleToday: { borderWidth: 1.5, borderColor: theme.primary },
  dayNum: { fontSize: 11, fontWeight: '500', color: theme.textSecondary },
  dayNumFilled: { color: theme.background, fontWeight: '700' },
  calFooter: { fontSize: 10, color: theme.textMuted, textAlign: 'center', marginTop: 10 },
});

// ─── Screen styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, letterSpacing: 0.2 },
  headerCount: { fontSize: 12, color: theme.textMuted, marginTop: 2, fontWeight: '500' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  iconBtnActive: { backgroundColor: theme.primary + '15', borderWidth: 1, borderColor: theme.primary + '40', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  writeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, shadowColor: theme.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
  },
  writeBtnText: { fontSize: 12, fontWeight: '700', color: theme.background },

  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: theme.border },
  searchInput: { flex: 1, fontSize: 15, color: theme.textPrimary, padding: 0 },

  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14, flexWrap: 'wrap' },
  tabChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tabChipActive: {
    backgroundColor: theme.primary + '15', borderWidth: 1, borderColor: theme.primary + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabChipText: { fontSize: 12, fontWeight: '600', color: theme.textMuted },
  tabChipTextActive: { color: theme.primary, fontWeight: '700' },
  typeFilterPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, backgroundColor: theme.primary + '15', borderWidth: 0.5, borderColor: theme.primary + '30' },
  typeFilterPillText: { fontSize: 11, fontWeight: '600', color: theme.primary },

  summaryCard: {
    backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, borderLeftWidth: 3, padding: 14, width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  summaryIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryEmoji: { fontSize: 20, marginBottom: 6 },
  summaryEmojiLarge: { fontSize: 36, lineHeight: 40 },
  summaryNum: { fontSize: 22, fontWeight: '700', lineHeight: 26, textAlign: 'center' },
  summaryLabel: { fontSize: 10, fontWeight: '600', color: theme.textMuted, letterSpacing: 1, marginTop: 6, textTransform: 'uppercase', textAlign: 'center' },
  summarySub: { fontSize: 10, color: theme.textMuted, marginTop: 4, fontStyle: 'italic', textAlign: 'center', lineHeight: 14 },

  dateSection: { marginBottom: 18 },
  dateDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, marginTop: 8 },
  dateDividerLine: { flex: 1, height: 0.5, backgroundColor: theme.border },
  dateDividerText: { fontSize: 10, fontWeight: '700', color: theme.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },

  entryCard: {
    backgroundColor: theme.surface, borderRadius: 14, padding: 13,
    borderWidth: 1, borderColor: theme.border, borderLeftWidth: 3,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  entryTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  ritualDot: { width: 8, height: 8, borderRadius: 4, shadowOpacity: 0.4, shadowRadius: 2, shadowOffset: { width: 0, height: 0 } },
  typeIconWrap: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  entryTitle: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, fontFamily: theme.fonts.serif },
  entryType: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  moodPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, borderWidth: 0.5 },
  moodPillText: { fontSize: 10, fontWeight: '600' },
  entryPreview: { fontSize: 13, color: theme.textSecondary, lineHeight: 18, fontFamily: theme.fonts.serif, fontStyle: 'italic', marginBottom: 3 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tagChip: { backgroundColor: theme.accent + '12', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 0.5, borderColor: theme.accent + '25' },
  tagText: { fontSize: 11, color: theme.accent, fontWeight: '600' },

  searchEmpty: { alignItems: 'center', paddingVertical: 50, gap: 10 },
  searchEmptyText: { fontSize: 13, color: theme.textMuted, textAlign: 'center' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyImage: { width: 140, height: 140, marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', lineHeight: 19, marginBottom: 24, fontFamily: theme.fonts.serif },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 22 },
  emptyCtaText: { fontSize: 13, fontWeight: '700', color: theme.background },

  fab: {
    position: 'absolute', right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
