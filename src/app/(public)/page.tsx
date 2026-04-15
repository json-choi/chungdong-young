import { AnnouncementView } from "@/components/public/announcement-view";
import { getPublishedAnnouncements } from "@/server/data/announcements";

export const revalidate = 3600;

export default async function PublicPage() {
  const now = new Date();
  const all = await getPublishedAnnouncements();

  const current = all.filter((item) => {
    if (!item.showOnFeed) return false;
    const start = new Date(item.startAt);
    if (start > now) return false;
    if (item.endAt && new Date(item.endAt) < now) return false;
    return true;
  });

  const archived = all.filter((item) => {
    if (!item.showOnFeed) return false;
    if (!item.endAt) return false;
    return new Date(item.endAt) < now;
  });

  const calendarItems = all.filter((item) => item.showOnCalendar);

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
      calendarItems={calendarItems}
    />
  );
}
