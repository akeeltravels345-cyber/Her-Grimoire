import { Ritual, Category, Manifestation } from '../services/mockData';

export interface StatusConfig {
  bg: string;
  border: string;
  color: string;
  label: string;
}

export interface DateMeta {
  daysUntil: number;
  isToday: boolean;
  isOverdue: boolean;
  isUrgent: boolean;
}

export interface WeekViewCache {
  categoryColorMap: Map<string, string>;
  manifestStatusMap: Map<string, string>;
  statusConfigMap: Record<string, StatusConfig>;
  dateMetaMap: Map<string, DateMeta>;
  createdAt: number;
}

export function buildCategoryColorCache(
  categories: Category[],
  categoryColors: Record<string, string>
): Map<string, string> {
  const map = new Map<string, string>();
  try {
    categories.forEach(cat => {
      const color = categoryColors[cat.id];
      if (color) map.set(cat.id, color);
    });
  } catch (e) {
    console.error('[buildCategoryColorCache] Error:', e);
  }
  return map;
}

export function buildManifestStatusCache(
  manifestations: Manifestation[]
): Map<string, string> {
  const map = new Map<string, string>();
  try {
    manifestations.forEach(m => {
      if (m.ritualId) {
        map.set(m.ritualId, m.status);
      }
      // Also cache by series/group IDs for grouped rituals
      if (m.id.startsWith('mf_series_')) {
        const seriesId = m.id.replace('mf_series_', '');
        map.set(`series:${seriesId}`, m.status);
      }
      if (m.id.startsWith('mf_group_')) {
        const groupId = m.id.replace('mf_group_', '');
        map.set(`group:${groupId}`, m.status);
      }
    });
  } catch (e) {
    console.error('[buildManifestStatusCache] Error:', e);
  }
  return map;
}

export function buildStatusConfigMap(): Record<string, StatusConfig> {
  return {
    scheduled: { color: '#A78BFA', label: 'Scheduled', icon: 'event', bg: '#A78BFA18' },
    approaching: { color: '#F59E0B', label: 'Approaching', icon: 'notifications-active', bg: '#F59E0B18' },
    completed: { color: '#5EBD8A', label: 'Done', icon: 'check-circle', bg: '#5EBD8A18' },
    overdue: { color: '#EF4444', label: 'Overdue', icon: 'error-outline', bg: '#EF444418' },
    brewing: { color: '#A78BFA', label: '🪄 Brewing', bg: '#A78BFA18' },
    stirring: { color: '#4EA8DE', label: '🌊 Stirring', bg: '#4EA8DE18' },
    spilled: { color: '#5EBD8A', label: '⭐ Spilled', bg: '#5EBD8A18' },
  };
}

export function buildDateMetaCache(
  rituals: Ritual[],
  today: Date
): Map<string, DateMeta> {
  const map = new Map<string, DateMeta>();
  try {
    const nowTime = today.getTime();
    rituals.forEach(r => {
      if (r.scheduledDate) {
        try {
          const scheduled = new Date(r.scheduledDate).getTime();
          const diffMs = scheduled - nowTime;
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          map.set(r.id, {
            daysUntil: diffDays,
            isToday: diffDays === 0,
            isOverdue: diffDays < 0,
            isUrgent: diffDays > 0 && diffDays <= 3,
          });
        } catch (e) {
          console.error(`[buildDateMetaCache] Error parsing date for ritual ${r.id}:`, e);
        }
      }
    });
  } catch (e) {
    console.error('[buildDateMetaCache] Error:', e);
  }
  return map;
}

export function buildWeekViewCache(
  rituals: Ritual[],
  categories: Category[],
  categoryColors: Record<string, string>,
  manifestations: Manifestation[],
  today: Date
): WeekViewCache {
  try {
    return {
      categoryColorMap: buildCategoryColorCache(categories, categoryColors),
      manifestStatusMap: buildManifestStatusCache(manifestations),
      statusConfigMap: buildStatusConfigMap(),
      dateMetaMap: buildDateMetaCache(rituals, today),
      createdAt: Date.now(),
    };
  } catch (e) {
    console.error('[buildWeekViewCache] Fatal error, returning empty cache:', e);
    // Return minimal valid cache to prevent crashes
    return {
      categoryColorMap: new Map(),
      manifestStatusMap: new Map(),
      statusConfigMap: buildStatusConfigMap(),
      dateMetaMap: new Map(),
      createdAt: Date.now(),
    };
  }
}

export function getCategoryColor(
  cache: WeekViewCache,
  categoryId: string,
  fallback: string
): string {
  return cache.categoryColorMap.get(categoryId) || fallback;
}

export function getManifestStatus(
  cache: WeekViewCache,
  ritualId: string | null | undefined,
  seriesId?: string,
  groupId?: string
): string | undefined {
  if (ritualId) {
    const status = cache.manifestStatusMap.get(ritualId);
    if (status) return status;
  }
  if (seriesId) {
    return cache.manifestStatusMap.get(`series:${seriesId}`);
  }
  if (groupId) {
    return cache.manifestStatusMap.get(`group:${groupId}`);
  }
  return undefined;
}

export function getDateMeta(
  cache: WeekViewCache,
  ritualId: string
): DateMeta | undefined {
  return cache.dateMetaMap.get(ritualId);
}
