import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/sqlite-core";

// Fixed UTC text preserves the source PostgreSQL microseconds in stored data.
// Application Date values retain the same millisecond precision as before.
export const utcTimestamp = customType<{ data: Date; driverData: string }>({
  dataType: () => "text",
  toDriver: (value) => value.toISOString().replace(/(\.\d{3})Z$/, "$1000Z"),
  fromDriver: (value) => new Date(value),
});
export const timeText = customType<{ data: string; driverData: string }>({
  dataType: () => "text",
  toDriver: (value) => /^\d{2}:\d{2}$/.test(value) ? `${value}:00` : value,
  fromDriver: (value) => value,
});
export const utcNow = sql`(strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z')`;
