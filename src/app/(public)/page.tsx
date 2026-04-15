import { AnnouncementView } from "@/components/public/announcement-view";
import { getPublishedAnnouncements } from "@/server/data/announcements";
import type { Announcement } from "@/server/db/schema";
import type { AnnouncementListItem } from "@/components/public/types";

export const revalidate = 3600;

function toListItem(a: Announcement): AnnouncementListItem {
  // Strip bodyHtml + audit fields from RSC payload — list view doesn't render them.
  // Saves several KB per item on pages with many rich-text posts.
  return {
    id: a.id,
    title: a.title,
    imageUrls: a.imageUrls,
    linkUrl: a.linkUrl,
    priority: a.priority,
    startAt: a.startAt,
    endAt: a.endAt,
    isAllDay: a.isAllDay,
    eventStartAt: a.eventStartAt,
    eventEndAt: a.eventEndAt,
    showOnFeed: a.showOnFeed,
    showOnCalendar: a.showOnCalendar,
  };
}

export default async function PublicPage() {
  const now = new Date();
  const all = await getPublishedAnnouncements();

  // Single-pass partition — no repeated array.filter scans on the same data
  const current: AnnouncementListItem[] = [];
  const archived: AnnouncementListItem[] = [];
  const calendar: AnnouncementListItem[] = [];

  for (const item of all) {
    if (item.showOnCalendar) {
      calendar.push(toListItem(item));
    }
    if (item.showOnFeed) {
      const start = new Date(item.startAt);
      if (start > now) continue;
      const end = item.endAt ? new Date(item.endAt) : null;
      if (end && end < now) {
        archived.push(toListItem(item));
      } else {
        current.push(toListItem(item));
      }
    }
  }

  if (current.length === 0 && archived.length === 0) {
    return (
      <div className="text-center py-24 text-sm text-church-muted">
        아직 공지사항이 없어요
      </div>
    );
  }

  return (
    <AnnouncementView
      items={current}
      archivedItems={archived}
      calendarItems={calendar}
    />
  );
}
