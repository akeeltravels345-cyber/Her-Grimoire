/**
 * Date formatting and calculation helpers
 * Centralizes date logic scattered across the app
 */

/**
 * Get current month as YYYY-MM string
 */
export function getCurrentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Format date as localized full date (e.g., "January 15, 2025")
 */
export function formatFullDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date as short format (e.g., "Jan 15")
 */
export function formatShortDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date with day of week (e.g., "Monday, January 15, 2025")
 */
export function formatFullDateWithDay(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date with short day name (e.g., "Mon, Jan 15")
 */
export function formatDateWithShortDay(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date with short day and year (e.g., "Mon, Jan 15, 2025")
 */
export function formatDateWithDayAndYear(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get number of days until a date (negative if past)
 * Used for countdown timers and status display
 */
export function getDaysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);

  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get countdown label for display
 * e.g., "Today", "Tomorrow", "In 5 days", "1 day overdue"
 */
export function getCountdownLabel(dateStr: string): string {
  const daysCount = getDaysUntil(dateStr);

  if (daysCount < -1) return `${Math.abs(daysCount)} days overdue`;
  if (daysCount === -1) return '1 day overdue';
  if (daysCount === 0) return 'Today';
  if (daysCount === 1) return 'Tomorrow';
  return `In ${daysCount} days`;
}

/**
 * Check if date is today
 */
export function isToday(dateStr: string | Date): boolean {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is in the past
 */
export function isPast(dateStr: string | Date): boolean {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const now = new Date();
  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return date < now;
}

/**
 * Check if date is in the future
 */
export function isFuture(dateStr: string | Date): boolean {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const now = new Date();
  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return date > now;
}

/**
 * Get start of month for a given date
 */
export function getMonthStart(dateStr?: string): Date {
  const date = dateStr ? new Date(dateStr) : new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get end of month for a given date
 */
export function getMonthEnd(dateStr?: string): Date {
  const date = dateStr ? new Date(dateStr) : new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Format date with long day of week only (e.g., "Monday")
 */
export function formatWeekdayLong(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Format date with short day of week only (e.g., "Mon")
 */
export function formatWeekdayShort(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Format date with long month only (e.g., "January")
 */
export function formatMonthLong(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', { month: 'long' });
}

/**
 * Format date with short month only (e.g., "Jan")
 */
export function formatMonthShort(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', { month: 'short' });
}

/**
 * Format date with long day and month, no year (e.g., "Monday, January 15")
 */
export function formatDateWithLongDay(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date with month and year only (e.g., "January 2025")
 */
export function formatMonthYear(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format date with short weekday, short month, and day (e.g., "Mon, Jan 15")
 */
export function formatDateShortFull(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date with narrow weekday only (e.g., "M")
 */
export function formatWeekdayNarrow(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', { weekday: 'narrow' });
}

/**
 * Format date with short month and year (e.g., "Jan 2025")
 */
export function formatShortMonthYear(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
