import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { and, eq, isNull, lte, or, gte, desc } from "drizzle-orm";
import { AnnouncementCard } from "@/components/public/announcement-card";

export const dynamic = "force-dynamic";

export default async function PublicPage() {
  const now = new Date();

  const items = await db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.isPublished, true),
        isNull(announcements.deletedAt),
        lte(announcements.startAt, now),
        or(isNull(announcements.endAt), gte(announcements.endAt, now))
      )
    )
    .orderBy(desc(announcements.priority), desc(announcements.startAt))
    .limit(50);

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-church-muted">
        현재 공지사항이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <AnnouncementCard key={item.id} announcement={item} />
      ))}
    </div>
  );
}
