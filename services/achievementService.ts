import { Ritual, ManifestationRecord } from './mockData';
import { StandaloneJournalEntry } from './mockData';
import { Achievement, AchievementType, ACHIEVEMENT_DEFINITIONS } from '../components/AchievementBadge';

export interface UserAchievements {
  [key in AchievementType]?: Achievement;
}

export class AchievementService {
  /**
   * Calculate achievements based on user data
   */
  static calculateAchievements(
    rituals: Ritual[],
    manifestations: ManifestationRecord[],
    standaloneEntries: StandaloneJournalEntry[],
    unlockedAchievements: Record<AchievementType, string | undefined> = {}
  ): Achievement[] {
    const achievements: Achievement[] = [];
    const completedRituals = rituals.filter(r => r.status === 'completed').length;
    const journalEntries = standaloneEntries.length;
    const manifestedCount = manifestations.filter(m => m.status === 'manifested').length;

    // First Ritual
    const hasFirstRitual = completedRituals >= 1;
    achievements.push({
      ...ACHIEVEMENT_DEFINITIONS.first_ritual,
      isUnlocked: hasFirstRitual,
      unlockedAt: unlockedAchievements.first_ritual,
    });

    // Five Rituals
    const hasFiveRituals = completedRituals >= 5;
    achievements.push({
      ...ACHIEVEMENT_DEFINITIONS.five_rituals,
      isUnlocked: hasFiveRituals,
      unlockedAt: unlockedAchievements.five_rituals,
    });

    // Fifty Rituals
    const hasFiftyRituals = completedRituals >= 50;
    achievements.push({
      ...ACHIEVEMENT_DEFINITIONS.fifty_rituals,
      isUnlocked: hasFiftyRituals,
      unlockedAt: unlockedAchievements.fifty_rituals,
    });

    // Hundred Rituals
    const hasHundredRituals = completedRituals >= 100;
    achievements.push({
      ...ACHIEVEMENT_DEFINITIONS.hundred_rituals,
      isUnlocked: hasHundredRituals,
      unlockedAt: unlockedAchievements.hundred_rituals,
    });

    // First Journal Entry
    const hasFirstJournal = journalEntries >= 1;
    achievements.push({
      ...ACHIEVEMENT_DEFINITIONS.first_journal,
      isUnlocked: hasFirstJournal,
      unlockedAt: unlockedAchievements.first_journal,
    });

    // First Manifestation Result
    const hasFirstManifestation = manifestedCount >= 1;
    achievements.push({
      ...ACHIEVEMENT_DEFINITIONS.first_manifestation,
      isUnlocked: hasFirstManifestation,
      unlockedAt: unlockedAchievements.first_manifestation,
    });

    // Manifestation Unlocked
    const manifestationUnlocked = manifestations.length >= 1;
    achievements.push({
      ...ACHIEVEMENT_DEFINITIONS.manifestation_unlocked,
      isUnlocked: manifestationUnlocked,
      unlockedAt: unlockedAchievements.manifestation_unlocked,
    });

    // Perfect Week
    const hasPerfectWeek = this.checkPerfectWeek(rituals);
    achievements.push({
      ...ACHIEVEMENT_DEFINITIONS.perfect_week,
      isUnlocked: hasPerfectWeek,
      unlockedAt: unlockedAchievements.perfect_week,
    });

    // Perfect Month
    const hasPerfectMonth = this.checkPerfectMonth(rituals);
    achievements.push({
      ...ACHIEVEMENT_DEFINITIONS.perfect_month,
      isUnlocked: hasPerfectMonth,
      unlockedAt: unlockedAchievements.perfect_month,
    });

    // Streaks
    const currentStreak = this.calculateCurrentStreak(rituals);
    achievements.push({
      ...ACHIEVEMENT_DEFINITIONS.streak_3,
      isUnlocked: currentStreak >= 3,
      unlockedAt: unlockedAchievements.streak_3,
    });

    achievements.push({
      ...ACHIEVEMENT_DEFINITIONS.streak_7,
      isUnlocked: currentStreak >= 7,
      unlockedAt: unlockedAchievements.streak_7,
    });

    achievements.push({
      ...ACHIEVEMENT_DEFINITIONS.streak_30,
      isUnlocked: currentStreak >= 30,
      unlockedAt: unlockedAchievements.streak_30,
    });

    return achievements;
  }

  /**
   * Check if user had a perfect week (all scheduled rituals completed)
   */
  private static checkPerfectWeek(rituals: Ritual[]): boolean {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

    const weekRituals = rituals.filter(r => {
      if (!r.scheduledDate) return false;
      const date = new Date(r.scheduledDate);
      return date >= weekStart && date <= weekEnd;
    });

    if (weekRituals.length === 0) return false;

    const completedInWeek = weekRituals.filter(r => r.status === 'completed').length;
    return completedInWeek === weekRituals.length && weekRituals.length > 0;
  }

  /**
   * Check if user had a perfect month (all scheduled rituals completed)
   */
  private static checkPerfectMonth(rituals: Ritual[]): boolean {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthRituals = rituals.filter(r => {
      if (!r.scheduledDate) return false;
      const date = new Date(r.scheduledDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    if (monthRituals.length === 0) return false;

    const completedInMonth = monthRituals.filter(r => r.status === 'completed').length;
    return completedInMonth === monthRituals.length && monthRituals.length > 0;
  }

  /**
   * Calculate the current streak of consecutive days with completed rituals
   */
  static calculateCurrentStreak(rituals: Ritual[]): number {
    if (rituals.length === 0) return 0;

    const completedByDate: Map<string, boolean> = new Map();

    rituals.forEach(ritual => {
      if (ritual.status === 'completed' && ritual.completedDate) {
        const date = new Date(ritual.completedDate);
        const dateStr = date.toISOString().split('T')[0];
        completedByDate.set(dateStr, true);
      }
    });

    if (completedByDate.size === 0) return 0;

    // Start from today and go backwards
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (completedByDate.has(currentDate.toISOString().split('T')[0])) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }

  /**
   * Check for newly unlocked achievements
   */
  static getNewlyUnlockedAchievements(
    currentAchievements: Achievement[],
    previousUnlocked: Record<AchievementType, string | undefined>
  ): Achievement[] {
    return currentAchievements.filter(
      achievement =>
        achievement.isUnlocked &&
        !previousUnlocked[achievement.id]
    );
  }
}
