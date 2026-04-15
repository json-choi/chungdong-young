import type { Announcement } from "@/server/db/schema";

/**
 * Slimmed-down shape for list/calendar rendering. Excludes `bodyHtml` and
 * audit fields so the RSC payload stays small on pages that never render
 * the post body.
 */
export type AnnouncementListItem = Pick<
  Announcement,
  | "id"
  | "title"
  | "imageUrls"
  | "linkUrl"
  | "priority"
  | "startAt"
  | "endAt"
  | "isAllDay"
  | "eventStartAt"
  | "eventEndAt"
  | "showOnFeed"
  | "showOnCalendar"
>;
