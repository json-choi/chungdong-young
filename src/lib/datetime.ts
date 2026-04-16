/**
 * Centralized date/time helpers.
 *
 * The site operates in a single fixed timezone (Korea / Asia/Seoul) regardless
 * of where an admin or visitor is browsing from. All `timestamptz` values are
 * stored as UTC in the DB; these helpers are the only place that knows about
 * the KST offset.
 *
 * Contract:
 *  - `<input type="datetime-local">` and `type="date"` give naked strings with
 *    no timezone — we always interpret them as KST via `fromZonedTime`.
 *  - Display always formats via `formatInTimeZone` so the output matches
 *    Korean local time even when the runtime's system timezone differs
 *    (Vercel edge, foreign admin, etc.).
 */

import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

export const APP_TIMEZONE = "Asia/Seoul";

/**
 * Convert a `<input type="datetime-local">` value ("YYYY-MM-DDTHH:MM") or
 * `<input type="date">` value ("YYYY-MM-DD") to an ISO-8601 UTC string,
 * interpreting the value as KST wall-clock time.
 */
export function localInputToIso(value: string): string {
  if (!value) return "";
  // `fromZonedTime` expects a full ISO-like string; pad date-only values.
  const normalized = value.length === 10 ? `${value}T00:00:00` : value;
  return fromZonedTime(normalized, APP_TIMEZONE).toISOString();
}

/**
 * Format a stored UTC Date for `<input type="datetime-local">` in KST.
 */
export function formatForDateTimeInput(date: Date | string | null): string {
  if (!date) return "";
  return formatInTimeZone(new Date(date), APP_TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Format a stored UTC Date for `<input type="date">` in KST.
 */
export function formatForDateInput(date: Date | string | null): string {
  if (!date) return "";
  return formatInTimeZone(new Date(date), APP_TIMEZONE, "yyyy-MM-dd");
}

/**
 * Format a Date in KST using a date-fns format pattern.
 */
export function formatKst(
  date: Date | string,
  pattern: string,
  options?: Parameters<typeof formatInTimeZone>[3]
): string {
  return formatInTimeZone(new Date(date), APP_TIMEZONE, pattern, options);
}

/**
 * Convert a UTC Date to a "zoned" Date whose local getters (getFullYear,
 * getHours, …) reflect KST. Useful for date-fns functions that operate on
 * the local components of a Date (startOfMonth, differenceInCalendarDays,
 * isSameDay, etc.) when the calling environment's system timezone isn't KST.
 */
export function toKstDate(date: Date | string): Date {
  return toZonedTime(new Date(date), APP_TIMEZONE);
}
