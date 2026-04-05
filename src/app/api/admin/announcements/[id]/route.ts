import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { getAdminSession, unauthorizedResponse } from "@/server/auth/guard";
import { updateAnnouncementSchema } from "@/server/validation/announcement";
import { eq, and, isNull } from "drizzle-orm";
import { sanitizeHtml } from "@/server/services/sanitize";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateAnnouncementSchema.parse(body);

    const updateData: Record<string, unknown> = {
      updatedBy: session.user.id,
      updatedAt: new Date(),
    };

    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.bodyHtml !== undefined) {
      updateData.bodyHtml = sanitizeHtml(parsed.bodyHtml);
    }
    if (parsed.linkUrl !== undefined)
      updateData.linkUrl = parsed.linkUrl || null;
    if (parsed.priority !== undefined) updateData.priority = parsed.priority;
    if (parsed.startAt !== undefined)
      updateData.startAt = new Date(parsed.startAt);
    if (parsed.endAt !== undefined)
      updateData.endAt = parsed.endAt ? new Date(parsed.endAt) : null;
    if (parsed.isPublished !== undefined)
      updateData.isPublished = parsed.isPublished;
    if (parsed.imageUrl !== undefined)
      updateData.imageUrl = parsed.imageUrl || null;
    if (parsed.imageBlobPath !== undefined)
      updateData.imageBlobPath = parsed.imageBlobPath || null;

    const [item] = await db
      .update(announcements)
      .set(updateData)
      .where(
        and(eq(announcements.id, id), isNull(announcements.deletedAt))
      )
      .returning();

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json(
      { error: "입력 데이터가 올바르지 않습니다" },
      { status: 422 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  const { id } = await params;

  const [item] = await db
    .update(announcements)
    .set({
      deletedAt: new Date(),
      isPublished: false,
    })
    .where(
      and(eq(announcements.id, id), isNull(announcements.deletedAt))
    )
    .returning();

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
