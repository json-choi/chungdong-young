import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { getAdminSession, unauthorizedResponse } from "@/server/auth/guard";
import { createAnnouncementSchema } from "@/server/validation/announcement";
import { desc, isNull } from "drizzle-orm";
import { sanitizeHtml } from "@/server/services/sanitize";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  const items = await db
    .select()
    .from(announcements)
    .where(isNull(announcements.deletedAt))
    .orderBy(desc(announcements.priority), desc(announcements.createdAt));

  return NextResponse.json({ items });
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
        isPublished: parsed.isPublished,
        imageUrl: parsed.imageUrl || null,
        imageBlobPath: parsed.imageBlobPath || null,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "입력 데이터가 올바르지 않습니다" },
      { status: 422 }
    );
  }
}
