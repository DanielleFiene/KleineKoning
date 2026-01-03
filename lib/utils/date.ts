// lib/utils/date.ts
// Utility functions for consistent date handling across the application
// Uses UTC date strings to avoid timezone issues

import { addDays, format } from "date-fns";

/**
 * Get today's date as a string in YYYY-MM-DD format
 * Uses local date to avoid timezone issues
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const result = `${year}-${month}-${day}`;
  console.log("🔍 [getTodayString] DEBUG:", {
    now: now.toString(),
    nowISO: now.toISOString(),
    nowUTC: now.toUTCString(),
    year,
    month,
    day,
    result,
    timezoneOffset: now.getTimezoneOffset(),
  });
  return result;
}

/**
 * Get today as a Date object (normalized to local midnight)
 */
export function getTodayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Parse a YYYY-MM-DD string to a Date object in local timezone
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const result = new Date(year, month - 1, day);
  console.log("🔍 [parseDateString] DEBUG:", {
    input: dateStr,
    year,
    month,
    day,
    result: result.toString(),
    resultISO: result.toISOString(),
    resultYear: result.getFullYear(),
    resultMonth: result.getMonth() + 1,
    resultDay: result.getDate(),
    timezoneOffset: result.getTimezoneOffset(),
  });
  return result;
}

/**
 * Get the Monday of the current week as YYYY-MM-DD string
 * This avoids Date object timezone issues entirely
 */
export function getCurrentWeekMondayString(): string {
  const todayStr = getTodayString();
  const today = parseDateString(todayStr);
  
  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = today.getDay();
  
  // Calculate days to subtract to get to Monday
  // Sunday = 0 -> go back 6 days
  // Monday = 1 -> go back 0 days
  // Tuesday = 2 -> go back 1 day
  // etc.
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Subtract days to get Monday
  const monday = addDays(today, -daysToMonday);
  
  const result = format(monday, "yyyy-MM-dd");
  console.log("🔍 [getCurrentWeekMondayString] DEBUG:", {
    todayStr,
    today: today.toString(),
    dayOfWeek,
    daysToMonday,
    monday: monday.toString(),
    result,
  });
  return result;
}

/**
 * Get the Monday of the current week as Date object
 */
export function getCurrentWeekMonday(): Date {
  const mondayStr = getCurrentWeekMondayString();
  const result = parseDateString(mondayStr);
  console.log("🔍 [getCurrentWeekMonday] DEBUG:", {
    mondayStr,
    result: result.toString(),
    resultISO: result.toISOString(),
  });
  return result;
}

