import { cache } from "react";
import { unstable_cache } from "next/cache";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";

export const ANNOUNCEMENTS_TAG = "announcements";

async function fetchPublishedAnnouncements() {
  return db
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
}

async function fetchPublishedAnnouncementById(id: string) {
  const [item] = await db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.id, id),
        eq(announcements.isPublished, true),
        isNull(announcements.deletedAt)
      )
    )
    .limit(1);

  return item ?? null;
}

// ISR cache: invalidated by revalidateTag on admin mutations
// + React.cache for per-request deduplication
export const getPublishedAnnouncements = cache(
  unstable_cache(fetchPublishedAnnouncements, ["published-announcements"], {
    tags: [ANNOUNCEMENTS_TAG],
    revalidate: 3600,
  })
);

export const getPublishedAnnouncementById = cache((id: string) =>
  unstable_cache(
    () => fetchPublishedAnnouncementById(id),
    ["published-announcement", id],
    {
      tags: [ANNOUNCEMENTS_TAG, `announcement:${id}`],
      revalidate: 3600,
    }
  )()
);
