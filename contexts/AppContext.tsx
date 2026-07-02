import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Ritual, JournalEntry, ManifestationRecord, ManifestationResult, StandaloneJournalEntry, LibraryRitual, Deity } from '../services/mockData';
import { PracticeCategory, DEFAULT_CATEGORIES, DEFAULT_CATEGORY_COLORS, DEFAULT_DEITIES, DEFAULT_DEITY_COLORS } from '../constants/config';

export interface JournalEntryType {
  id: string;
  label: string;
  icon: string;
}

const DEFAULT_MOODS = ['Empowered', 'Aligned', 'Renewed', 'Elevated', 'Balanced', 'Connected', 'Transformed', 'Inspired', 'Grounded', 'Amazed', 'Peaceful'];
const OLD_DEFAULT_MOODS = ['Peaceful', 'Grateful', 'Empowered', 'Grounded', 'Joyful', 'Connected']; // Old defaults for migration
const NEW_ONLY_MOODS = ['Aligned', 'Renewed', 'Balanced', 'Transformed', 'Inspired', 'Amazed']; // Moods unique to new defaults
const MOODS_KEY = 'grimoire_moods';
const CORE_CATEGORIES_KEY = 'grimoire_core_categories';

/**
 * Migration: Reset moods if they're still the old defaults (with possible custom additions)
 */
function migrateMoodsData(loadedMoods: any[]): string[] {
  if (!Array.isArray(loadedMoods) || loadedMoods.length === 0) {
    return DEFAULT_MOODS;
  }

  // Check if we have at least 4 of the 6 old default moods (allows for some custom moods mixed in)
  const oldDefaultCount = loadedMoods.filter(m => OLD_DEFAULT_MOODS.includes(m)).length;

  // If we have 4+ of the old defaults, it's likely the old list - migrate to new defaults
  if (oldDefaultCount >= 4) {
    return DEFAULT_MOODS;
  }

  // Otherwise return as-is (likely mostly custom moods)
  return loadedMoods;
}

const DEFAULT_JOURNAL_TYPES: JournalEntryType[] = [
  { id: 'reflection', label: 'Reflection', icon: '\u{1F4D6}' },
  { id: 'dream', label: 'Dream', icon: '\u{1F319}' },
  { id: 'encounter', label: 'Encounter', icon: '\u{1F441}\uFE0F' },
  { id: 'insight', label: 'Insight', icon: '\u{1F4A1}' },
  
];

export interface MonthlySnapshot {
  month: string;
  label: string;
  intention: string;
  release: string;
  ritualIntention: string;
  reflection: string;
  intentionSet: boolean;
  coreCategoryResults: {
    categoryId: string;
    categoryName: string;
    completed: boolean;
    ritualsCompleted: number;
    ritualsScheduled: number;
  }[];
  totalScheduled: number;
  totalCompleted: number;
  totalMissed: number;
  completionRate: number;
  missedRituals: { id: string; name: string; scheduledDate: string; category: string; }[];
  completedRituals: { id: string; name: string; category: string; completedDate: string; }[];
  monthlyStreakCount: number;
  createdAt: string;
}

interface AppContextType {
  rituals: Ritual[];
  libraryRituals: LibraryRitual[];
  categories: PracticeCategory[];
  categoryColors: Record<string, string>;
  deities: Deity[];
  deityColors: Record<string, string>;
  manifestations: ManifestationRecord[];
  standaloneEntries: StandaloneJournalEntry[];
  isLoaded: boolean;
  addRitual: (ritual: Omit<Ritual, 'id' | 'createdAt' | 'timesPerformed' | 'journal'> & { status?: Ritual['status'] }) => void;
  updateRitual: (id: string, updates: Partial<Ritual>) => void;
  deleteRitual: (id: string, deleteHistory?: boolean) => void;
  deleteFutureInSeries: (seriesId: string, fromDate: string) => void;
  deleteEntireSeries: (seriesId: string) => void;
  stopSchedule: (seriesId: string) => void;
  addJournalEntry: (ritualId: string, entry: Omit<JournalEntry, 'id'>, opts?: { markComplete?: boolean }) => void;
  updateJournalEntry: (ritualId: string, entryId: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (ritualId: string, entryId: string) => void;
  updateStandaloneEntry: (id: string, updates: Partial<StandaloneJournalEntry>) => void;
  addManifestationResult: (ritualId: string, note: string, date: string, type: 'sign' | 'manifested', signType?: import('../services/mockData').SignType, imageUrl?: string) => void;
  deleteManifestationResult: (manifestationId: string, resultId: string) => void;
  deleteManifestationRecord: (manifestationId: string) => void;
  updateManifestation: (manifestationId: string, updates: { intention?: string; category?: string }) => void;
  unspillManifestation: (manifestationId: string) => void;
  undoLastManifestationAction: (manifestationId: string) => void;
  getManifestations: () => ManifestationRecord[];
  addCategory: (category: PracticeCategory, color: string) => void;
  deleteCategory: (categoryId: string) => void;
  addDeity: (deity: Deity, color: string) => void;
  deleteDeity: (deityId: string) => void;
  addStandaloneEntry: (entry: Omit<StandaloneJournalEntry, 'id'>) => void;
  deleteStandaloneEntry: (id: string) => void;
  updateStatus: (ritualId: string, status: 'scheduled' | 'approaching' | 'completed' | 'overdue' | 'dismissed') => void;
  addLibraryRitual: (ritual: Omit<LibraryRitual, 'id' | 'createdAt' | 'timesPerformed'>) => string;
  updateLibraryRitual: (id: string, updates: Partial<LibraryRitual>) => void;
  deleteLibraryRitual: (id: string) => void;
  addToPractice: (libraryId: string, overrides?: { scheduledDate?: string; schedule?: LibraryRitual['schedule']; consecutiveDays?: number; tangibleOutcome?: string; scheduleDetail?: string }) => void;
  journalEntryTypes: JournalEntryType[];
  addJournalEntryType: (type: JournalEntryType) => void;
  deleteJournalEntryType: (id: string) => void;
  moods: string[];
  addMood: (mood: string) => void;
  deleteMood: (mood: string) => void;
  coreCategories: string[];
  setCoreCategories: (ids: string[]) => void;
  monthlySnapshots: MonthlySnapshot[];
  monthlyIntentions: Record<string, { intention: string; release: string; ritualIntention: string; intentionSet: boolean; month: string }>;
  viewingMonth: string;
  setIntentionForMonth: (monthStr: string, intention: string, release: string, ritualIntention: string) => void;
  getIntentionForMonth: (monthStr: string) => { intention: string; release: string; ritualIntention: string; intentionSet: boolean; month: string };
  goToMonth: (offset: number) => void;
  setViewingMonthDirect: (monthStr: string) => void;
  currentMonthIntention: { intention: string; release: string; ritualIntention: string; intentionSet: boolean; month: string };
  setMonthlyIntention: (intention: string, release: string, ritualIntention: string) => void;
  monthlyStreak: number;
  saveReflection: (month: string, reflection: string) => void;
  isOnboarded: boolean;
  markOnboarded: () => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'grimoire_rituals';
const CATEGORIES_KEY = 'grimoire_categories';
const COLORS_KEY = 'grimoire_category_colors';
const DEITIES_KEY = 'grimoire_deities';
const DEITY_COLORS_KEY = 'grimoire_deity_colors';
const MANIFESTATIONS_KEY = 'grimoire_manifestations';
const STANDALONE_KEY = 'grimoire_standalone_entries';
const NOTIF_IDS_KEY = 'grimoire_notification_ids';
const LIBRARY_KEY = 'grimoire_library';
const JOURNAL_TYPES_KEY = 'grimoire_journal_types';
const DATA_VERSION_KEY = 'grimoire_data_version';
const SNAPSHOTS_KEY = 'grimoire_monthly_snapshots';
const MONTHLY_INTENTION_KEY = 'grimoire_monthly_intention';
const MONTHLY_INTENTIONS_KEY = 'grimoire_monthly_intentions';
const VIEWING_MONTH_KEY = 'grimoire_viewing_month';
const ONBOARDED_KEY = 'grimoire_onboarded';

const CURRENT_DATA_VERSION = '4';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function getStoredNotifIds(): Promise<Record<string, string[]>> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_IDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function setStoredNotifIds(ids: Record<string, string[]>): Promise<void> {
  await AsyncStorage.setItem(NOTIF_IDS_KEY, JSON.stringify(ids));
}

/**
 * Migration: Convert legacy single-value categories/moods to arrays
 */
function migrateRitualsData(rituals: any[]): Ritual[] {
  return rituals.map(r => {
    // Migrate category → categories
    if (r.category && !r.categories) {
      return {
        ...r,
        categories: [r.category],
        category: undefined, // Remove legacy field
        deities: r.deities || [],
      };
    }
    // Ensure categories is always an array
    if (!r.categories) {
      return { ...r, categories: [], deities: r.deities || [] };
    }
    // Ensure deities is always an array
    if (!r.deities) {
      return { ...r, deities: [] };
    }
    return r;
  });
}

function migrateLibraryRitualsData(rituals: any[]): LibraryRitual[] {
  return rituals.map(r => {
    // Migrate category → categories
    if (r.category && !r.categories) {
      return {
        ...r,
        categories: [r.category],
        category: undefined, // Remove legacy field
        deities: r.deities || [],
      };
    }
    // Ensure categories is always an array
    if (!r.categories) {
      return { ...r, categories: [], deities: r.deities || [] };
    }
    // Ensure deities is always an array
    if (!r.deities) {
      return { ...r, deities: [] };
    }
    return r;
  });
}

function migrateJournalEntriesData(entries: any[]): JournalEntry[] {
  return entries.map(e => {
    // Migrate mood → moods
    if (e.mood && !e.moods) {
      return {
        ...e,
        moods: [e.mood],
        mood: undefined, // Remove legacy field
      };
    }
    // Ensure moods is always an array
    if (!e.moods) {
      return { ...e, moods: [] };
    }
    return e;
  });
}

function migrateStandaloneEntriesData(entries: any[]): StandaloneJournalEntry[] {
  return entries.map(e => {
    // Migrate mood → moods
    if (e.mood && !e.moods) {
      return {
        ...e,
        moods: [e.mood],
        mood: undefined, // Remove legacy field
      };
    }
    // Ensure moods is always an array (optional field)
    if (e.moods === undefined) {
      return { ...e, moods: [] };
    }
    return e;
  });
}

function migrateManifestationsData(manifestations: any[]): ManifestationRecord[] {
  return manifestations.map(m => {
    // Migrate category → categories
    if (m.category && !m.categories) {
      return {
        ...m,
        categories: [m.category],
        category: undefined, // Remove legacy field
        deities: m.deities || [],
      };
    }
    // Ensure categories is always an array
    if (!m.categories) {
      return { ...m, categories: [], deities: m.deities || [] };
    }
    // Ensure deities is always an array
    if (!m.deities) {
      return { ...m, deities: [] };
    }
    return m;
  });
}

/**
 * Migration: Reset deities to new defaults if they're all from the old auto-populated list
 * Old IDs: spirit_guides, moon_goddess, sun_god, ascended_masters, earth_goddess,
 *          divine_masculine, divine_feminine, archangels, nature_spirits, (ancestors was in old list too)
 */
function migrateDeities(stored: any[]): Deity[] {
  if (!Array.isArray(stored) || stored.length === 0) {
    return DEFAULT_DEITIES;
  }

  const oldAutoPopulatedIds = [
    'spirit_guides', 'moon_goddess', 'sun_god', 'ascended_masters', 'earth_goddess',
    'divine_masculine', 'divine_feminine', 'archangels', 'nature_spirits', 'ancestors'
  ];

  // Check if all stored deities are from the old auto-populated list
  const allFromOldList = stored.every(d => oldAutoPopulatedIds.includes(d.id));

  // If all are from the old list (meaning user never added custom deities), reset to new defaults
  if (allFromOldList) {
    return DEFAULT_DEITIES;
  }

  // Otherwise, keep the stored deities (user has custom deities mixed in)
  return stored;
}

async function cancelNotificationsForRitual(ritualId: string): Promise<void> {
  const stored = await getStoredNotifIds();
  const ids = stored[ritualId] || [];
  for (const nId of ids) {
    await Notifications.cancelScheduledNotificationAsync(nId).catch(() => {});
  }
  delete stored[ritualId];
  await setStoredNotifIds(stored);
}

/**
 * Get current month as YYYY-MM string
 */
function getCurrentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function scheduleRemindersForRitual(ritual: { id: string; name: string; scheduledDate?: string; status: string }): Promise<void> {
  if (Platform.OS === 'web') return;

  if (!ritual.scheduledDate || ritual.status === 'completed') {
    await cancelNotificationsForRitual(ritual.id);
    return;
  }

  await cancelNotificationsForRitual(ritual.id);

  const scheduledTime = new Date(ritual.scheduledDate);
  const now = new Date();
  const newIds: string[] = [];

  const threeDaysBefore = new Date(scheduledTime);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
  threeDaysBefore.setHours(9, 0, 0, 0);

  if (threeDaysBefore > now) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Ritual Reminder',
          body: `\u{1F52E} ${ritual.name} is in 3 days \u2014 prepare your space`,
          data: { ritualId: ritual.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: threeDaysBefore },
      });
      newIds.push(id);
    } catch {}
  }

  const dayOf = new Date(scheduledTime);
  dayOf.setHours(9, 0, 0, 0);

  if (dayOf > now) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Ritual Today',
          body: `\u2728 Today is the day \u2014 ${ritual.name} is scheduled for today`,
          data: { ritualId: ritual.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayOf },
      });
      newIds.push(id);
    } catch {}
  }

  if (newIds.length > 0) {
    const stored = await getStoredNotifIds();
    stored[ritual.id] = newIds;
    await setStoredNotifIds(stored);
  }
}

// Helper: generate propagation dates
function generatePropagationDates(schedule: string, startDate: Date): Date[] {
  const dates: Date[] = [];
  if (schedule === 'daily') {
    for (let i = 1; i <= 30; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
  } else if (schedule === 'weekly') {
    for (let i = 1; i <= 12; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i * 7);
      dates.push(d);
    }
  } else if (schedule === 'monthly') {
    for (let i = 1; i <= 12; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      dates.push(d);
    }
  } else if (schedule === 'moon_phase') {
    const LUNAR_CYCLE = 29.53058867;
    for (let i = 1; i <= 12; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + Math.round(i * LUNAR_CYCLE));
      dates.push(d);
    }
  }
  return dates;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [categories, setCategories] = useState<PracticeCategory[]>(DEFAULT_CATEGORIES);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(DEFAULT_CATEGORY_COLORS);
  const [deities, setDeities] = useState<Deity[]>(DEFAULT_DEITIES);
  const [deityColors, setDeityColors] = useState<Record<string, string>>(DEFAULT_DEITY_COLORS);
  const [manifestations, setManifestations] = useState<ManifestationRecord[]>([]);
  const [standaloneEntries, setStandaloneEntries] = useState<StandaloneJournalEntry[]>([]);
  const [libraryRituals, setLibraryRituals] = useState<LibraryRitual[]>([]);
  const [journalEntryTypes, setJournalEntryTypes] = useState<JournalEntryType[]>(DEFAULT_JOURNAL_TYPES);
  const [moods, setMoods] = useState<string[]>(DEFAULT_MOODS);
  const [coreCategories, setCoreCategoriesState] = useState<string[]>([]);
  const [monthlySnapshots, setMonthlySnapshots] = useState<MonthlySnapshot[]>([]);
  const [monthlyIntentions, setMonthlyIntentions] = useState<Record<string, { intention: string; release: string; ritualIntention: string; intentionSet: boolean; month: string }>>({});
  const [viewingMonth, setViewingMonth] = useState<string>(getCurrentMonthStr());
  const [currentMonthIntention, setCurrentMonthIntention] = useState({ intention: '', release: '', ritualIntention: '', intentionSet: false, month: '' });
  // DEVELOPMENT: Set to true to skip onboarding during development
  const [isOnboarded, setIsOnboarded] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasRequestedPermissions = useRef(false);

  useEffect(() => {
    if (!hasRequestedPermissions.current) {
      hasRequestedPermissions.current = true;
      requestNotificationPermissions();
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const storedVersion = await AsyncStorage.getItem(DATA_VERSION_KEY);

        if (storedVersion !== CURRENT_DATA_VERSION) {
          await AsyncStorage.multiRemove([
            STORAGE_KEY, MANIFESTATIONS_KEY, STANDALONE_KEY, NOTIF_IDS_KEY,
          ]);
          await AsyncStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
          const [catData, colorData] = await Promise.all([
            AsyncStorage.getItem(CATEGORIES_KEY),
            AsyncStorage.getItem(COLORS_KEY),
          ]);
          if (catData) { try { setCategories(JSON.parse(catData)); } catch {} }
          if (colorData) { try { setCategoryColors(JSON.parse(colorData)); } catch {} }
          setIsLoaded(true);
          return;
        }

        const [ritualData, catData, colorData, deityData, deityColorData, manifData, standaloneData, libraryData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(CATEGORIES_KEY),
          AsyncStorage.getItem(COLORS_KEY),
          AsyncStorage.getItem(DEITIES_KEY),
          AsyncStorage.getItem(DEITY_COLORS_KEY),
          AsyncStorage.getItem(MANIFESTATIONS_KEY),
          AsyncStorage.getItem(STANDALONE_KEY),
          AsyncStorage.getItem(LIBRARY_KEY),
        ]);
        if (ritualData) {
          try {
            const parsed = JSON.parse(ritualData);
            const migrated = migrateRitualsData(parsed);
            // Also migrate journal entries within each ritual
            const withMigratedJournals = migrated.map(r => ({
              ...r,
              journal: migrateJournalEntriesData(r.journal || []),
            }));
            setRituals(withMigratedJournals);
          } catch {}
        }
        if (catData) { try { setCategories(JSON.parse(catData)); } catch {} }
        if (colorData) { try { setCategoryColors(JSON.parse(colorData)); } catch {} }
        if (deityData) {
          try {
            const parsed = JSON.parse(deityData);
            const migrated = migrateDeities(parsed);
            setDeities(migrated);
          } catch {}
        }
        if (deityColorData) { try { setDeityColors(JSON.parse(deityColorData)); } catch {} }
        if (manifData) {
          try {
            const parsed = JSON.parse(manifData);
            const migrated = migrateManifestationsData(parsed);
            setManifestations(migrated);
          } catch {}
        }
        if (standaloneData) {
          try {
            const parsed = JSON.parse(standaloneData);
            const migrated = migrateStandaloneEntriesData(parsed);
            setStandaloneEntries(migrated);
          } catch {}
        }
        if (libraryData) {
          try {
            const parsed = JSON.parse(libraryData);
            const migrated = migrateLibraryRitualsData(parsed);
            setLibraryRituals(migrated);
          } catch {}
        }
        const journalTypesData = await AsyncStorage.getItem(JOURNAL_TYPES_KEY);
        if (journalTypesData) { try { setJournalEntryTypes(JSON.parse(journalTypesData)); } catch {} }
        const moodsData = await AsyncStorage.getItem(MOODS_KEY);
        if (moodsData) {
          try {
            const loadedMoods = JSON.parse(moodsData);
            const migratedMoods = migrateMoodsData(loadedMoods);
            setMoods(migratedMoods);
          } catch {
            setMoods(DEFAULT_MOODS);
          }
        } else {
          setMoods(DEFAULT_MOODS);
        }

        // Load core categories
        const loadedCats: PracticeCategory[] = catData ? JSON.parse(catData) : DEFAULT_CATEGORIES;
        const coreCatData = await AsyncStorage.getItem(CORE_CATEGORIES_KEY);
        if (coreCatData) {
          try { setCoreCategoriesState(JSON.parse(coreCatData)); } catch {}
        } else {
          const coreNames = ['money work', 'glamour', 'unblocking', 'protection'];
          const defaults = loadedCats
            .filter(c => coreNames.some(n => c.name.toLowerCase().includes(n)))
            .map(c => c.id)
            .slice(0, 4);
          if (defaults.length < 4 && loadedCats.length > 0) {
            const remaining = loadedCats
              .filter(c => !defaults.includes(c.id))
              .map(c => c.id)
              .slice(0, 4 - defaults.length);
            defaults.push(...remaining);
          }
          setCoreCategoriesState(defaults);
        }

        // Load monthly snapshots
        const snapshotData = await AsyncStorage.getItem(SNAPSHOTS_KEY);
        if (snapshotData) { try { setMonthlySnapshots(JSON.parse(snapshotData)); } catch {} }
        const intentionData = await AsyncStorage.getItem(MONTHLY_INTENTION_KEY);
        if (intentionData) { try { setCurrentMonthIntention(JSON.parse(intentionData)); } catch {} }

        // Load monthly intentions (by month)
        const monthlyIntentionsData = await AsyncStorage.getItem(MONTHLY_INTENTIONS_KEY);
        if (monthlyIntentionsData) { try { setMonthlyIntentions(JSON.parse(monthlyIntentionsData)); } catch {} }

        // Load viewing month preference
        const viewingMonthData = await AsyncStorage.getItem(VIEWING_MONTH_KEY);
        if (viewingMonthData) { try { setViewingMonth(viewingMonthData); } catch {} }

        // Onboarding flag - default to true (skip onboarding during development)
        const onboardedFlag = await AsyncStorage.getItem(ONBOARDED_KEY);
        if (onboardedFlag === 'true') {
          setIsOnboarded(true);
        } else if (onboardedFlag === null) {
          // First load - set to true to skip onboarding during development
          setIsOnboarded(true);
          await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
        }
      } catch {}
      setIsLoaded(true);
    })();
  }, []);

  const scheduleAllReminders = useCallback(async () => {
    for (const r of rituals) {
      await scheduleRemindersForRitual(r);
    }
  }, [rituals]);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rituals));
      scheduleAllReminders();
    }
  }, [rituals, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories)); }, [categories, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(COLORS_KEY, JSON.stringify(categoryColors)); }, [categoryColors, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(DEITIES_KEY, JSON.stringify(deities)); }, [deities, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(DEITY_COLORS_KEY, JSON.stringify(deityColors)); }, [deityColors, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(MANIFESTATIONS_KEY, JSON.stringify(manifestations)); }, [manifestations, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(STANDALONE_KEY, JSON.stringify(standaloneEntries)); }, [standaloneEntries, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(libraryRituals)); }, [libraryRituals, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(JOURNAL_TYPES_KEY, JSON.stringify(journalEntryTypes)); }, [journalEntryTypes, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(MOODS_KEY, JSON.stringify(moods)); }, [moods, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(CORE_CATEGORIES_KEY, JSON.stringify(coreCategories)); }, [coreCategories, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(monthlySnapshots)); }, [monthlySnapshots, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(MONTHLY_INTENTION_KEY, JSON.stringify(currentMonthIntention)); }, [currentMonthIntention, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(MONTHLY_INTENTIONS_KEY, JSON.stringify(monthlyIntentions)); }, [monthlyIntentions, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(VIEWING_MONTH_KEY, viewingMonth); }, [viewingMonth, isLoaded]);

  // Check for rituals that should now have manifestations created (rituals scheduled for current month)
  useEffect(() => {
    if (!isLoaded) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Find rituals scheduled for current month that don't have manifestations yet
    const ritualsNeedingManifest = rituals.filter(ritual => {
      if (!ritual.tangibleOutcome || ritual.tangibleOutcome.trim().length === 0) return false;
      if (!ritual.scheduledDate) return false;

      const ritualDate = new Date(ritual.scheduledDate);
      const ritualMonth = ritualDate.getMonth();
      const ritualYear = ritualDate.getFullYear();

      // Check if ritual is in current month
      const isCurrentMonth = (ritualYear === currentYear && ritualMonth === currentMonth);
      if (!isCurrentMonth) return false;

      // Check if manifestation already exists
      // For series/group rituals, check by seriesId/groupId; for single rituals, check by ritualId
      if (ritual.seriesId) {
        const hasManifest = manifestations.some(m => m.id === 'mf_series_' + ritual.seriesId);
        return !hasManifest;
      } else if (ritual.groupId) {
        const hasManifest = manifestations.some(m => m.id === 'mf_group_' + ritual.groupId);
        return !hasManifest;
      } else {
        const hasManifest = manifestations.some(m => m.ritualId === ritual.id);
        return !hasManifest;
      }
    });

    // Create manifestations for rituals that need them (one per series, one per group, one per non-series ritual)
    if (ritualsNeedingManifest.length > 0) {
      // Track which series/groups we've already created manifestations for
      const seriesCreated = new Set<string>();
      const groupsCreated = new Set<string>();
      const newManifests = ritualsNeedingManifest
        .filter(ritual => {
          if (ritual.seriesId) {
            if (seriesCreated.has(ritual.seriesId)) return false;
            seriesCreated.add(ritual.seriesId);
          } else if (ritual.groupId) {
            if (groupsCreated.has(ritual.groupId)) return false;
            groupsCreated.add(ritual.groupId);
          }
          return true;
        })
        .map(ritual => ({
          id: ritual.seriesId ? 'mf_series_' + ritual.seriesId : ritual.groupId ? 'mf_group_' + ritual.groupId : 'mf_' + ritual.id,
          ritualId: ritual.id,
          ritualName: ritual.name,
          intention: ritual.tangibleOutcome!.trim(),
          categories: ritual.categories && ritual.categories.length > 0 ? ritual.categories : (ritual.category ? [ritual.category] : []),
          deities: ritual.deities || [],
          status: 'brewing' as const,
          results: [],
          createdAt: new Date().toISOString(),
        }));

      setManifestations(prev => [...newManifests, ...prev]);
    }
  }, [isLoaded, rituals, manifestations]);

  // Clean up orphaned manifestations (ones whose ritualId no longer exists, or old duplicates from groups/series)
  useEffect(() => {
    if (!isLoaded) return;

    setManifestations(prev => {
      const ritualIds = new Set(rituals.map(r => r.id));
      const seriesIds = new Set(rituals.map(r => r.seriesId).filter(Boolean));
      const groupIds = new Set(rituals.map(r => r.groupId).filter(Boolean));

      return prev.filter(m => {
        // Keep new-format series manifestations (mf_series_...)
        if (m.id.startsWith('mf_series_')) {
          const seriesId = m.id.replace('mf_series_', '');
          return seriesIds.has(seriesId);
        }
        // Keep new-format group manifestations (mf_group_...)
        if (m.id.startsWith('mf_group_')) {
          const groupId = m.id.replace('mf_group_', '');
          return groupIds.has(groupId);
        }
        // Keep single ritual manifestations if the ritual exists
        return ritualIds.has(m.ritualId);
      });
    });
  }, [isLoaded]);

  const addRitual = (ritual: Omit<Ritual, 'id' | 'createdAt' | 'timesPerformed' | 'journal'> & { status?: Ritual['status'] }) => {
    console.log('[addRitual] Starting with ritual:', ritual);
    const id = Date.now().toString();
    const seriesId = 'series_' + id;
    const shouldPropagate = ['daily', 'weekly', 'monthly', 'moon_phase'].includes(ritual.schedule);

    console.log('[addRitual] ID generated:', id, 'shouldPropagate:', shouldPropagate);

    const numConsecutive = ritual.consecutiveDays || 1;
    const groupId = numConsecutive > 1 ? 'group_' + id : undefined;

    // Use the libraryId if provided, otherwise leave it undefined
    // Library saving is now handled explicitly via the user dialog in add-ritual.tsx
    const resolvedLibraryId = ritual.libraryId;

      // --- Consecutive days mode: create a group of entries ---
      if (numConsecutive > 1 && ritual.scheduledDate) {
        console.log('[addRitual] Entering consecutive days mode with numConsecutive:', numConsecutive);
        const baseDate = new Date(ritual.scheduledDate);
        const groupRituals: Ritual[] = [];

        for (let i = 0; i < numConsecutive; i++) {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + i);
          groupRituals.push({
            ...ritual,
            id: i === 0 ? id : id + '_g' + (i + 1),
            name: `${ritual.name} \u2014 Day ${i + 1} of ${numConsecutive}`,
            groupId,
            consecutiveDays: numConsecutive,
            libraryId: resolvedLibraryId,
            createdAt: new Date().toISOString(),
            timesPerformed: 0,
            journal: [],
            status: 'scheduled',
            scheduledDate: d.toISOString(),
          });
        }
        console.log('[addRitual] Created', groupRituals.length, 'group rituals');
        setRituals(prev => [...groupRituals, ...prev]);
      } else {
        console.log('[addRitual] Entering normal mode');
        // --- Normal mode (single or schedule-propagated) ---
        let newRitual: Ritual = {
          ...ritual,
          id,
          libraryId: resolvedLibraryId,
          createdAt: new Date().toISOString(),
          timesPerformed: 0,
          journal: [],
          status: ritual.status || 'scheduled',
          seriesId: shouldPropagate ? seriesId : undefined,
        };

        if (shouldPropagate && ritual.scheduledDate) {
          console.log('[addRitual] Creating propagated series with shouldPropagate:', shouldPropagate);
          const baseDate = new Date(ritual.scheduledDate);
          const futureDates = generatePropagationDates(ritual.schedule, baseDate);
          console.log('[addRitual] Generated', futureDates.length, 'future dates');
          const propagatedRituals: Ritual[] = [newRitual];

          for (let i = 0; i < futureDates.length; i++) {
            propagatedRituals.push({
              ...ritual,
              id: id + '_p' + (i + 1),
              seriesId,
              libraryId: resolvedLibraryId,
              createdAt: new Date().toISOString(),
              timesPerformed: 0,
              journal: [],
              status: 'scheduled',
              scheduledDate: futureDates[i].toISOString(),
            });
          }
          console.log('[addRitual] Setting', propagatedRituals.length, 'propagated rituals');
          setRituals(prev => [...propagatedRituals, ...prev]);
        } else {
          console.log('[addRitual] Setting single new ritual');
          setRituals(prev => [newRitual, ...prev]);
        }
      }

      // Create manifestation with tangibleOutcome or ritual name as fallback
      const manifSource = (ritual.tangibleOutcome && ritual.tangibleOutcome.trim().length > 0)
        ? ritual.tangibleOutcome.trim()
        : ritual.name; // Use ritual name as default intention

      console.log('[addRitual] Manifestation source:', manifSource);

      if (true) {  // Always create manifestation
        // Check if ritual is scheduled for this month or earlier
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let shouldCreateManif = true;
        if (ritual.scheduledDate) {
          const ritualDate = new Date(ritual.scheduledDate);
          const ritualMonth = ritualDate.getMonth();
          const ritualYear = ritualDate.getFullYear();

          // Only create manifestation if ritual is in current month or earlier
          shouldCreateManif = (ritualYear < currentYear) || (ritualYear === currentYear && ritualMonth <= currentMonth);
          console.log('[addRitual] Manifestation date check:', { ritualDate, shouldCreateManif });
        }

        if (shouldCreateManif) {
          // For series/group rituals, use seriesId/groupId as manifestation ID so all instances share one manifestation
          // For non-series/group rituals, use ritual ID
          // Use the local seriesId/groupId variables created in this function, not ritual properties
          const manifId = groupId ? 'mf_group_' + groupId : (shouldPropagate ? 'mf_series_' + seriesId : 'mf_' + id);

          // Check if manifestation already exists (for series/group, only create once)
          const manifAlreadyExists = manifestations.some(m => m.id === manifId);

          console.log('[addRitual] Manifestation creation:', { manifId, manifAlreadyExists });

          if (!manifAlreadyExists) {
            // Handle both old (category) and new (categories) formats
            const categories = ritual.categories && ritual.categories.length > 0
              ? ritual.categories
              : (ritual.category ? [ritual.category] : []);

            const newManif: ManifestationRecord = {
              id: manifId,
              ritualId: id, // Store the current (first) ritual ID for reference
              ritualName: ritual.name,
              intention: manifSource,
              categories,
              status: 'brewing',
              results: [],
              createdAt: new Date().toISOString(),
            };
            console.log('[addRitual] Creating new manifestation:', newManif);
            setManifestations(prev => [newManif, ...prev]);
          }
        }
      }

    console.log('[addRitual] Complete');
  };

  const updateRitual = (id: string, updates: Partial<Ritual>) => {
    setRituals(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    if (updates.name) {
      setManifestations(prev => prev.map(m => m.ritualId === id ? { ...m, ritualName: updates.name! } : m));
    }
  };

  const deleteRitual = (id: string, deleteHistory: boolean = true) => {
    const ritual = rituals.find(r => r.id === id);
    cancelNotificationsForRitual(id);
    setRituals(prev => prev.filter(r => r.id !== id));
    if (deleteHistory) {
      // For series/group rituals, don't delete the shared manifestation here
      // (they should be deleted via deleteEntireSeries or when all group members are gone)
      // For non-series/group rituals, delete the manifestation by ritualId
      if (!ritual?.seriesId && !ritual?.groupId) {
        // For non-series/group rituals, delete by ritualId
        setManifestations(prev => prev.filter(m => m.ritualId !== id));
      }
    }
    // If deleteHistory is false, manifestations and journal entries are preserved
    // (journal entries are on the ritual object but history is kept)
  };

  // Delete all future (unperformed) rituals in a series from a given date onward
  const deleteFutureInSeries = (seriesId: string, fromDate: string) => {
    const fromTime = new Date(fromDate).getTime();
    // Capture ritual IDs before deletion to clean up manifestations
    const ritualIdsToDelete = rituals
      .filter(r =>
        r.seriesId === seriesId &&
        r.status !== 'completed' &&
        r.scheduledDate &&
        new Date(r.scheduledDate).getTime() >= fromTime
      )
      .map(r => r.id);

    setRituals(prev => {
      const toDelete = prev.filter(r =>
        r.seriesId === seriesId &&
        r.status !== 'completed' &&
        r.scheduledDate &&
        new Date(r.scheduledDate).getTime() >= fromTime
      );
      toDelete.forEach(r => cancelNotificationsForRitual(r.id));
      return prev.filter(r => !toDelete.some(d => d.id === r.id));
    });

    // Clean up manifestations: only delete series manifestation if entire series is gone
    setManifestations(prev => {
      // Check if any rituals remain in this series after deletion
      const remainingInSeries = rituals.filter(r => r.seriesId === seriesId && !ritualIdsToDelete.includes(r.id));
      const shouldDeleteSeriesManif = remainingInSeries.length === 0;

      return prev.filter(m => {
        // Delete series manifestation only if series is entirely gone
        if (m.id === 'mf_series_' + seriesId && shouldDeleteSeriesManif) return false;
        // Delete any orphaned ritual-specific manifestations
        if (!ritualIdsToDelete.includes(m.ritualId)) return true;
        return false;
      });
    });
  };

  // Delete every ritual in a series (keeps completed data via journal entries already logged)
  const deleteEntireSeries = (seriesId: string) => {
    // Capture series ritual IDs before deletion
    const seriesRitualIds = rituals.filter(r => r.seriesId === seriesId).map(r => r.id);

    setRituals(prev => {
      const toDelete = prev.filter(r => r.seriesId === seriesId);
      toDelete.forEach(r => cancelNotificationsForRitual(r.id));
      return prev.filter(r => r.seriesId !== seriesId);
    });
    // Clean up manifestations: delete series manifestation and any orphaned ritual-specific ones
    setManifestations(prev =>
      prev.filter(m => m.id !== 'mf_series_' + seriesId && !seriesRitualIds.includes(m.ritualId))
    );
  };

  // Stop a recurring schedule: delete all future unperformed rituals but keep completed/logged ones
  const stopSchedule = (seriesId: string) => {
    const now = new Date();
    setRituals(prev => {
      const toDelete = prev.filter(r =>
        r.seriesId === seriesId &&
        r.status !== 'completed' &&
        r.scheduledDate &&
        new Date(r.scheduledDate).getTime() > now.getTime()
      );
      toDelete.forEach(r => cancelNotificationsForRitual(r.id));
      // Keep completed and past rituals, remove only unperformed future ones
      return prev.filter(r => !toDelete.some(d => d.id === r.id));
    });
  };

  const addJournalEntry = (ritualId: string, entry: Omit<JournalEntry, 'id'>, opts?: { markComplete?: boolean }) => {
    const markComplete = opts?.markComplete !== false;
    const newEntry: JournalEntry = { ...entry, id: Date.now().toString() };
    setRituals(prev => prev.map(r => {
      if (r.id !== ritualId) return r;
      const entryTime = new Date(entry.date).getTime();
      const currentLastPerformed = r.lastPerformed ? new Date(r.lastPerformed).getTime() : 0;
      const newLastPerformed = entryTime > currentLastPerformed ? entry.date : r.lastPerformed || entry.date;
      if (markComplete) {
        return {
          ...r,
          journal: [newEntry, ...r.journal],
          lastPerformed: newLastPerformed,
          timesPerformed: r.timesPerformed + 1,
          status: 'completed' as const,
        };
      }
      return { ...r, journal: [newEntry, ...r.journal] };
    }));
  };

  const updateJournalEntry = (ritualId: string, entryId: string, updates: Partial<JournalEntry>) => {
    setRituals(prev => prev.map(r => {
      if (r.id !== ritualId) return r;
      return { ...r, journal: r.journal.map(e => e.id === entryId ? { ...e, ...updates } : e) };
    }));
  };

  const deleteJournalEntry = (ritualId: string, entryId: string) => {
    setRituals(prev => prev.map(r => {
      if (r.id !== ritualId) return r;
      return { ...r, journal: r.journal.filter(e => e.id !== entryId) };
    }));
  };

  const updateStandaloneEntry = (id: string, updates: Partial<StandaloneJournalEntry>) => {
    setStandaloneEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const addManifestationResult = (ritualId: string, note: string, date: string, type: 'sign' | 'manifested', signType?: import('../services/mockData').SignType, imageUrl?: string) => {
    const newResult: ManifestationResult = {
      id: 'mr_' + Date.now().toString(),
      note,
      date,
      type,
      signType,
      imageUrl,
    };
    setManifestations(prev => prev.map(m => {
      if (m.ritualId !== ritualId) return m;
      const newStatus = type === 'manifested' ? 'spilled' : m.status === 'spilled' ? 'spilled' : 'stirring';
      return {
        ...m,
        results: [...m.results, newResult],
        status: newStatus as ManifestationRecord['status'],
      };
    }));
  };

  const updateManifestation = (manifestationId: string, updates: { intention?: string; category?: string }) => {
    setManifestations(prev => prev.map(m => m.id !== manifestationId ? m : { ...m, ...updates }));
  };

  const deleteManifestationResult = (manifestationId: string, resultId: string) => {
    setManifestations(prev => prev.map(m => {
      if (m.id !== manifestationId) return m;
      const newResults = m.results.filter(r => r.id !== resultId);
      const newStatus: ManifestationRecord['status'] =
        newResults.some(r => r.type === 'manifested') ? 'spilled' :
        newResults.some(r => r.type === 'sign') ? 'stirring' : 'brewing';
      return { ...m, results: newResults, status: newStatus };
    }));
  };

  const deleteManifestationRecord = (manifestationId: string) => {
    setManifestations(prev => prev.filter(m => m.id !== manifestationId));
  };

  const unspillManifestation = (manifestationId: string) => {
    setManifestations(prev => prev.map(m => {
      if (m.id !== manifestationId || m.status !== 'spilled') return m;
      // Find and remove the spill result (the 'manifested' type result)
      const newResults = m.results.filter(r => r.type !== 'manifested');
      // Determine new status based on remaining results
      const newStatus: ManifestationRecord['status'] =
        newResults.some(r => r.type === 'sign') ? 'stirring' : 'brewing';
      return { ...m, results: newResults, status: newStatus };
    }));
  };

  const undoLastManifestationAction = (manifestationId: string) => {
    setManifestations(prev => prev.map(m => {
      if (m.id !== manifestationId || m.results.length === 0) return m;
      // Remove the most recent result
      const newResults = m.results.slice(0, -1);
      // Recalculate status based on remaining results
      const newStatus: ManifestationRecord['status'] =
        newResults.some(r => r.type === 'manifested') ? 'spilled' :
        newResults.some(r => r.type === 'sign') ? 'stirring' : 'brewing';
      return { ...m, results: newResults, status: newStatus };
    }));
  };

  const getManifestations = () => manifestations;

  const addCategory = (category: PracticeCategory, color: string) => {
    setCategories(prev => [...prev, category]);
    setCategoryColors(prev => ({ ...prev, [category.id]: color }));
  };

  const deleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    setCategoryColors(prev => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  };

  const addDeity = (deity: Deity, color: string) => {
    setDeities(prev => [...prev, deity]);
    setDeityColors(prev => ({ ...prev, [deity.id]: color }));
  };

  const deleteDeity = (deityId: string) => {
    setDeities(prev => prev.filter(d => d.id !== deityId));
    setDeityColors(prev => {
      const next = { ...prev };
      delete next[deityId];
      return next;
    });
  };

  const addStandaloneEntry = (entry: Omit<StandaloneJournalEntry, 'id'>) => {
    const newEntry: StandaloneJournalEntry = { ...entry, id: 'se_' + Date.now().toString() };
    setStandaloneEntries(prev => [newEntry, ...prev]);
  };

  const deleteStandaloneEntry = (id: string) => {
    setStandaloneEntries(prev => prev.filter(e => e.id !== id));
  };

  const addLibraryRitual = (ritual: Omit<LibraryRitual, 'id' | 'createdAt' | 'timesPerformed'>): string => {
    const id = 'lib_' + Date.now().toString();
    const newLibRitual: LibraryRitual = {
      ...ritual,
      id,
      createdAt: new Date().toISOString(),
      timesPerformed: 0,
    };
    setLibraryRituals(prev => [newLibRitual, ...prev]);
    return id;
  };

  const updateLibraryRitual = (id: string, updates: Partial<LibraryRitual>) => {
    setLibraryRituals(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteLibraryRitual = (id: string) => {
    // Find all practice instances of this library ritual
    const practiceInstances = rituals.filter(r => r.libraryId === id);

    // Remove library ritual
    setLibraryRituals(prev => prev.filter(r => r.id !== id));

    // Unlink practice instances (preserve history)
    if (practiceInstances.length > 0) {
      setRituals(prev => prev.map(r =>
        practiceInstances.some(pi => pi.id === r.id)
          ? { ...r, libraryId: undefined }
          : r
      ));
    }
  };

  const addJournalEntryType = (type: JournalEntryType) => {
    setJournalEntryTypes(prev => [...prev, type]);
  };

  const deleteJournalEntryType = (id: string) => {
    setJournalEntryTypes(prev => prev.filter(t => t.id !== id));
  };

  const addMood = (mood: string) => {
    const trimmed = mood.trim();
    if (!trimmed || moods.includes(trimmed)) return;
    setMoods(prev => [...prev, trimmed]);
  };

  const deleteMood = (mood: string) => {
    setMoods(prev => prev.filter(m => m !== mood));
  };

  const updateCoreCategories = (ids: string[]) => {
    const valid = ids.slice(0, 6);
    if (valid.length === 0) return;
    setCoreCategoriesState(valid);
  };

  const setIntentionForMonth = (monthStr: string, intention: string, release: string, ritualIntention: string) => {
    const intentionData = { intention, release, ritualIntention, intentionSet: true, month: monthStr };
    setMonthlyIntentions(prev => ({
      ...prev,
      [monthStr]: intentionData
    }));

    // If setting intentions for the current month, also update currentMonthIntention
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (monthStr === currentMonth) {
      setCurrentMonthIntention(intentionData);
    }
  };

  const getIntentionForMonth = (monthStr: string) => {
    return monthlyIntentions[monthStr] || { intention: '', release: '', ritualIntention: '', intentionSet: false, month: monthStr };
  };

  const goToMonth = (offset: number) => {
    // Navigate relative to the currently viewing month, not relative to today
    const [year, monthNum] = viewingMonth.split('-');
    let targetMonth = parseInt(monthNum) + offset;
    let targetYear = parseInt(year);

    // Handle year rollover
    while (targetMonth > 12) {
      targetMonth -= 12;
      targetYear += 1;
    }
    while (targetMonth < 1) {
      targetMonth += 12;
      targetYear -= 1;
    }

    const newMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    setViewingMonth(newMonth);
  };

  const setViewingMonthDirect = (monthStr: string) => {
    setViewingMonth(monthStr);
  };

  const setMonthlyIntention = (intention: string, release: string, ritualIntention: string) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonthIntention({ intention, release, ritualIntention, intentionSet: true, month });
    // Also save to monthlyIntentions for the reworked system
    setIntentionForMonth(month, intention, release, ritualIntention);
  };

  const createMonthlySnapshot = useCallback((year: number, month: number) => {
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const alreadyArchived = monthlySnapshots.some(s => s.month === monthStr);
    if (alreadyArchived) return;

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    const monthRituals = rituals.filter(r => {
      if (!r.scheduledDate) return false;
      const d = new Date(r.scheduledDate);
      return d >= monthStart && d <= monthEnd;
    });

    const completed = monthRituals.filter(r => r.status === 'completed');
    const missed = monthRituals.filter(r => r.status !== 'completed' && r.status !== 'dismissed');

    const coreCategoryResults = coreCategories.map(catId => {
      const cat = categories.find(c => c.id === catId);
      const catRituals = monthRituals.filter(r => r.category === catId);
      const catCompleted = catRituals.filter(r => r.status === 'completed');
      return {
        categoryId: catId,
        categoryName: cat?.name || catId,
        completed: catCompleted.length > 0,
        ritualsCompleted: catCompleted.length,
        ritualsScheduled: catRituals.length,
      };
    });

    const prevSnapshots = monthlySnapshots.filter(s => s.month < monthStr);
    const streak = prevSnapshots.length > 0
      ? prevSnapshots.reduce((count, s) => {
          if (s.coreCategoryResults.every(c => c.completed)) return count + 1;
          return 0;
        }, 0)
      : 0;

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    // Get intention for this month from monthlyIntentions
    const monthIntention = monthlyIntentions[monthStr] || { intention: '', release: '', ritualIntention: '', intentionSet: false, month: monthStr };

    const snapshot: MonthlySnapshot = {
      month: monthStr,
      label: `${monthNames[month]} ${year}`,
      intention: monthIntention.intention,
      release: monthIntention.release,
      ritualIntention: monthIntention.ritualIntention,
      reflection: '',
      intentionSet: monthIntention.intentionSet,
      coreCategoryResults,
      totalScheduled: monthRituals.length,
      totalCompleted: completed.length,
      totalMissed: missed.length,
      completionRate: monthRituals.length > 0 ? Math.round((completed.length / monthRituals.length) * 100) : 0,
      missedRituals: missed.map(r => ({ id: r.id, name: r.name, scheduledDate: r.scheduledDate || '', category: r.category })),
      completedRituals: completed.map(r => ({ id: r.id, name: r.name, category: r.category, completedDate: r.lastPerformed || r.scheduledDate || '' })),
      monthlyStreakCount: streak,
      createdAt: new Date().toISOString(),
    };

    setMonthlySnapshots(prev => [snapshot, ...prev]);
  }, [rituals, categories, coreCategories, monthlySnapshots, monthlyIntentions]);

  useEffect(() => {
    if (!isLoaded) return;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
    const alreadyArchived = monthlySnapshots.some(s => s.month === prevMonthStr);
    if (!alreadyArchived && rituals.length > 0) {
      createMonthlySnapshot(prevYear, prevMonth);
    }
  }, [isLoaded]);

  const monthlyStreak = monthlySnapshots.filter(s =>
    s.coreCategoryResults.every(c => c.completed)
  ).length;

  const addToPractice = (libraryId: string, overrides?: { scheduledDate?: string; schedule?: LibraryRitual['schedule']; consecutiveDays?: number; tangibleOutcome?: string; scheduleDetail?: string }) => {
    const libRitual = libraryRituals.find(r => r.id === libraryId);
    if (!libRitual) return;
    // Handle both legacy (category) and new (categories) formats
    const categoryIds = libRitual.categories && libRitual.categories.length > 0 ? libRitual.categories : (libRitual.category ? [libRitual.category] : []);
    addRitual({
      name: libRitual.name,
      categories: categoryIds,
      description: libRitual.description,
      intention: libRitual.intention,
      tangibleOutcome: overrides?.tangibleOutcome ?? libRitual.tangibleOutcome,
      ingredients: libRitual.ingredients,
      imageUrl: libRitual.imageUrl,
      referenceImages: libRitual.referenceImages,
      schedule: overrides?.schedule || libRitual.schedule,
      scheduleDetail: overrides?.scheduleDetail ?? libRitual.scheduleDetail,
      scheduledDate: overrides?.scheduledDate,
      consecutiveDays: overrides?.consecutiveDays,
      libraryId,
      status: 'scheduled',
    });
    // Increment timesPerformed on the library source
    setLibraryRituals(prev => prev.map(r => r.id === libraryId ? { ...r, timesPerformed: r.timesPerformed + 1 } : r));
  };

  const updateStatus = (ritualId: string, status: 'scheduled' | 'approaching' | 'completed' | 'overdue' | 'dismissed') => {
    setRituals(prev => prev.map(r => r.id === ritualId ? { ...r, status } : r));
  };

  const saveReflection = useCallback((month: string, reflection: string) => {
    setMonthlySnapshots(prev => {
      // Check if snapshot exists for this month
      const exists = prev.some(s => s.month === month);
      if (exists) {
        // Update existing snapshot
        return prev.map(s => s.month === month ? { ...s, reflection } : s);
      } else {
        // Create new snapshot if it doesn't exist
        const [year, monthNum] = month.split('-');
        const monthIndex = parseInt(monthNum) - 1;
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const newSnapshot: MonthlySnapshot = {
          month,
          label: `${monthNames[monthIndex]} ${year}`,
          intention: monthlyIntentions[month]?.intention || '',
          release: monthlyIntentions[month]?.release || '',
          ritualIntention: monthlyIntentions[month]?.ritualIntention || '',
          reflection,
          intentionSet: monthlyIntentions[month]?.intentionSet || false,
          coreCategoryResults: [],
          totalScheduled: 0,
          totalCompleted: 0,
          totalMissed: 0,
          completionRate: 0,
          missedRituals: [],
          completedRituals: [],
          monthlyStreakCount: 0,
          createdAt: new Date().toISOString(),
        };
        return [newSnapshot, ...prev];
      }
    });
  }, [monthlyIntentions]);

  const markOnboarded = useCallback(() => {
    setIsOnboarded(true);
    AsyncStorage.setItem(ONBOARDED_KEY, 'true');
  }, []);

  const clearAllData = async () => {
    setRituals([]);
    setManifestations([]);
    setStandaloneEntries([]);
    setLibraryRituals([]);
    setJournalEntryTypes(DEFAULT_JOURNAL_TYPES);
    setMoods(DEFAULT_MOODS);
    setCoreCategoriesState([]);
    setMonthlySnapshots([]);
    setMonthlyIntentions({});
    setViewingMonth(getCurrentMonthStr());
    setCurrentMonthIntention({ intention: '', release: '', ritualIntention: '', intentionSet: false, month: '' });
    setIsOnboarded(false);
    await AsyncStorage.multiRemove([STORAGE_KEY, MANIFESTATIONS_KEY, STANDALONE_KEY, NOTIF_IDS_KEY, LIBRARY_KEY, JOURNAL_TYPES_KEY, MOODS_KEY, CORE_CATEGORIES_KEY, SNAPSHOTS_KEY, MONTHLY_INTENTION_KEY, MONTHLY_INTENTIONS_KEY, VIEWING_MONTH_KEY, ONBOARDED_KEY, 'grimoire_spell_research']);
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  };

  return (
    <AppContext.Provider value={{
      rituals, libraryRituals, categories, categoryColors, deities, deityColors, manifestations, standaloneEntries, isLoaded,
      addRitual, updateRitual, deleteRitual, deleteFutureInSeries, deleteEntireSeries, stopSchedule,
      addJournalEntry, updateJournalEntry, deleteJournalEntry, updateStandaloneEntry,
      addManifestationResult, deleteManifestationResult, deleteManifestationRecord, updateManifestation, unspillManifestation, undoLastManifestationAction, getManifestations,
      addCategory, deleteCategory, addDeity, deleteDeity,
      addStandaloneEntry, deleteStandaloneEntry, updateStatus,
      addLibraryRitual, updateLibraryRitual, deleteLibraryRitual, addToPractice,
      journalEntryTypes, addJournalEntryType, deleteJournalEntryType,
      moods, addMood, deleteMood,
      coreCategories, setCoreCategories: updateCoreCategories,
      monthlySnapshots, monthlyIntentions, viewingMonth, setIntentionForMonth, getIntentionForMonth, goToMonth, setViewingMonthDirect, currentMonthIntention, setMonthlyIntention, monthlyStreak,
      saveReflection,
      isOnboarded, markOnboarded,
      clearAllData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
