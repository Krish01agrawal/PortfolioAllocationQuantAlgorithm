/**
 * Date Utilities
 * 
 * Purpose: Common date operations
 */

/**
 * Normalize date to start of month (UTC)
 */
export function normalizeToStartOfMonth(date: Date): Date {
  const normalized = new Date(date);
  normalized.setUTCDate(1);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Get first working day of month (skip weekends)
 */
export function getFirstWorkingDay(year: number, month: number): Date {
  let date = new Date(Date.UTC(year, month, 1));
  
  // If Saturday (6), move to Monday
  if (date.getUTCDay() === 6) {
    date.setUTCDate(date.getUTCDate() + 2);
  }
  // If Sunday (0), move to Monday
  else if (date.getUTCDay() === 0) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  
  return date;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Check if date is first day of month
 */
export function isFirstDayOfMonth(date: Date): boolean {
  return date.getUTCDate() === 1;
}

