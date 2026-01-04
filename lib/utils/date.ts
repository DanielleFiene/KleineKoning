/**
 * lib/utils/date.ts
 * 
 * Utility functies voor consistente datum handling in de applicatie. Functies voor
 * parsing, formatting, week berekeningen, en Nederlandse locale support.
 */

import { format, startOfWeek, parseISO } from "date-fns";

/**
 * Get today's date as a string in YYYY-MM-DD format
 * Uses local date to avoid timezone issues
 */
export function getTodayString(): string {
  const now = new Date();
  // Use local date components to avoid timezone issues
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today as a Date object (normalized to local midnight)
 */
export function getTodayDate(): Date {
  const todayStr = getTodayString();
  return parseISO(todayStr);
}

/**
 * Parse a YYYY-MM-DD string to a Date object in local timezone
 * This correctly parses date strings as local midnight, avoiding UTC timezone issues
 * that occur with new Date("2024-01-15") which parses as UTC midnight
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get the Monday of the current week
 */
export function getCurrentWeekMonday(): Date {
  return startOfWeek(getTodayDate(), { weekStartsOn: 1 });
}

/**
 * Get the Monday of the current week as a string (YYYY-MM-DD)
 */
export function getCurrentWeekMondayString(): string {
  return format(getCurrentWeekMonday(), "yyyy-MM-dd");
}
