import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { and, eq, isNull, desc } from "drizzle-orm";
import { AnnouncementView } from "@/components/public/announcement-view";

export const dynamic = "force-dynamic";

export default async function PublicPage() {
  const now = new Date();

  // All published, non-deleted announcements
  const all = await db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.isPublished, true),
        isNull(announcements.deletedAt)
      )
    )
    .orderBy(desc(announcements.priority), desc(announcements.startAt))
    .limit(100);

  // Current feed items: showOnFeed + within publication period
  const current = all.filter((item) => {
    if (!item.showOnFeed) return false;
    const start = new Date(item.startAt);
    if (start > now) return false;
    if (item.endAt && new Date(item.endAt) < now) return false;
    return true;
  });

  // Archived feed items: showOnFeed + publication period ended
  const archived = all.filter((item) => {
    if (!item.showOnFeed) return false;
    if (!item.endAt) return false;
    return new Date(item.endAt) < now;
  });

  // Calendar items (all, regardless of feed visibility)
  const calendarItems = all.filter((item) => item.showOnCalendar);

  if (current.length === 0 && archived.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-church-navy/5 mb-4">
          <svg
            className="w-7 h-7 text-church-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-sm text-church-muted">현재 공지사항이 없습니다</p>
      </div>
    );
  }

  return (
    <AnnouncementView
      items={current}
      archivedItems={archived}
      calendarItems={calendarItems}
    />
  );
}
