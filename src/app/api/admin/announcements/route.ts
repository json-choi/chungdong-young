import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { getAdminSession, unauthorizedResponse } from "@/server/auth/guard";
import { createAnnouncementSchema } from "@/server/validation/announcement";
import { desc, isNull } from "drizzle-orm";
import { sanitizeHtml } from "@/server/services/sanitize";
import { ANNOUNCEMENTS_TAG } from "@/server/data/announcements";
import { adminApiError } from "@/server/api/errors";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  try {
    const items = await db
      .select()
      .from(announcements)
      .where(isNull(announcements.deletedAt))
      .orderBy(desc(announcements.priority), desc(announcements.createdAt));

    return NextResponse.json({ items });
  } catch (err) {
    return adminApiError(err, "announcements.list");
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = createAnnouncementSchema.parse(body);

    const sanitizedHtml = sanitizeHtml(parsed.bodyHtml);

    const [item] = await db
      .insert(announcements)
      .values({
        title: parsed.title,
        bodyHtml: sanitizedHtml,
        linkUrl: parsed.linkUrl || null,
        priority: parsed.priority,
        startAt: new Date(parsed.startAt),
        endAt: parsed.endAt ? new Date(parsed.endAt) : null,
        isAllDay: parsed.isAllDay,
        eventStartAt: parsed.eventStartAt ? new Date(parsed.eventStartAt) : null,
        eventEndAt: parsed.eventEndAt ? new Date(parsed.eventEndAt) : null,
        showOnFeed: parsed.showOnFeed,
        showOnCalendar: parsed.showOnCalendar,
        isPublished: parsed.isPublished,
        imageUrls: parsed.imageUrls,
        imageBlobPaths: parsed.imageBlobPaths,
        imageAspect: parsed.imageAspect,
        imageFit: parsed.imageFit,
        imageFocals: parsed.imageFocals,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      })
      .returning();

    revalidateTag(ANNOUNCEMENTS_TAG, "max");
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return adminApiError(err, "announcements.create");
  }
}
