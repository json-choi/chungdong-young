import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    bodyHtml: text("body_html").notNull(),
    linkUrl: text("link_url"),
    priority: integer("priority").notNull().default(0),
    /* Visibility */
    showOnFeed: boolean("show_on_feed").notNull().default(true),
    showOnCalendar: boolean("show_on_calendar").notNull().default(false),
    /* Publication period — when this post appears in the feed */
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    /* Calendar event fields */
    isAllDay: boolean("is_all_day").notNull().default(false),
    eventStartAt: timestamp("event_start_at", { withTimezone: true }),
    eventEndAt: timestamp("event_end_at", { withTimezone: true }),
    isPublished: boolean("is_published").notNull().default(false),
    imageUrl: text("image_url"),
    imageBlobPath: text("image_blob_path"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
