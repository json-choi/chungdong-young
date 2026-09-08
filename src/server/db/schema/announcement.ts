import { utcTimestamp, utcNow } from "../d1-columns";
import {
  sqliteTable,
  text,
  integer,
  index,
  check,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

export const announcements = sqliteTable(
  "announcements",
  {
    id: text("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
    title: text("title").notNull(),
    bodyHtml: text("body_html").notNull(),
    linkUrl: text("link_url"),
    priority: integer("priority").notNull().default(0),
    /* Visibility */
    showOnFeed: integer("show_on_feed", { mode: "boolean" }).notNull().default(true),
    showOnCalendar: integer("show_on_calendar", { mode: "boolean" }).notNull().default(false),
    /* Publication period — when this post appears in the feed */
    startAt: utcTimestamp("start_at").notNull(),
    endAt: utcTimestamp("end_at"),
    /* Calendar event fields */
    isAllDay: integer("is_all_day", { mode: "boolean" }).notNull().default(false),
    eventStartAt: utcTimestamp("event_start_at"),
    eventEndAt: utcTimestamp("event_end_at"),
    isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
    /* Ordered image gallery — index 0 is the list thumbnail / OG image */
    imageUrls: text("image_urls", { mode: "json" }).$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    imageBlobPaths: text("image_blob_paths", { mode: "json" }).$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    /* Presentation: '16:9' | '4:3' | '1:1' | '3:4' | 'original' */
    imageAspect: text("image_aspect").notNull().default("16:9"),
    /* Fit mode: 'cover' = crop to fill, 'contain' = letterbox with padding */
    imageFit: text("image_fit").notNull().default("cover"),
    /* Per-image focal point (CSS object-position), index-aligned with imageUrls */
    imageFocals: text("image_focals", { mode: "json" }).$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    /* Denormalized unique-view counter; incremented atomically by the view-tracking endpoint */
    viewCount: integer("view_count").notNull().default(0),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: utcTimestamp("created_at")
      .notNull()
      .default(utcNow),
    updatedAt: utcTimestamp("updated_at")
      .notNull()
      .default(utcNow),
    deletedAt: utcTimestamp("deleted_at"),
  },
  (t) => [
    check(
      "announcements_schedule_check",
      sql`${t.endAt} IS NULL OR ${t.endAt} >= ${t.startAt}`
    ),
    index("announcements_public_query_idx").on(
      t.isPublished,
      t.startAt,
      t.endAt,
      t.priority
    ),
    index("announcements_deleted_at_idx").on(t.deletedAt),
  ]
);

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

/**
 * Per-day unique view log. Primary key dedups one hashed visitor per post per day.
 * `visitorHash` = SHA-256(ip + user-agent + BETTER_AUTH_SECRET) — no raw PII stored.
 */
export const announcementViews = sqliteTable(
  "announcement_views",
  {
    announcementId: text("announcement_id")
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    visitorHash: text("visitor_hash").notNull(),
    viewedDate: text("viewed_date").notNull(),
    viewedAt: utcTimestamp("viewed_at")
      .notNull()
      .default(utcNow),
  },
  (t) => [
    primaryKey({
      name: "announcement_views_pk",
      columns: [t.announcementId, t.visitorHash, t.viewedDate],
    }),
    index("announcement_views_announcement_idx").on(t.announcementId),
  ]
);

export type AnnouncementView = typeof announcementViews.$inferSelect;
