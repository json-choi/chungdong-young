import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { del } from "@vercel/blob";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { getAdminSession, unauthorizedResponse } from "@/server/auth/guard";
import { updateAnnouncementSchema } from "@/server/validation/announcement";
import { eq, and, isNull } from "drizzle-orm";
import { sanitizeHtml } from "@/server/services/sanitize";
import { ANNOUNCEMENTS_TAG } from "@/server/data/announcements";
import { adminApiError, AdminApiError } from "@/server/api/errors";

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
    if (parsed.isAllDay !== undefined) updateData.isAllDay = parsed.isAllDay;
    if (parsed.eventStartAt !== undefined)
      updateData.eventStartAt = parsed.eventStartAt
        ? new Date(parsed.eventStartAt)
        : null;
    if (parsed.eventEndAt !== undefined)
      updateData.eventEndAt = parsed.eventEndAt
        ? new Date(parsed.eventEndAt)
        : null;
    if (parsed.showOnFeed !== undefined) updateData.showOnFeed = parsed.showOnFeed;
    if (parsed.showOnCalendar !== undefined)
      updateData.showOnCalendar = parsed.showOnCalendar;
    if (parsed.isPublished !== undefined)
      updateData.isPublished = parsed.isPublished;
    if (parsed.imageUrls !== undefined) updateData.imageUrls = parsed.imageUrls;
    if (parsed.imageBlobPaths !== undefined)
      updateData.imageBlobPaths = parsed.imageBlobPaths;
    if (parsed.imageAspect !== undefined)
      updateData.imageAspect = parsed.imageAspect;
    if (parsed.imageFit !== undefined) updateData.imageFit = parsed.imageFit;
    if (parsed.imageFocals !== undefined)
      updateData.imageFocals = parsed.imageFocals;

    // Snapshot existing blobs so we can garbage-collect removed images
    const [existing] = await db
      .select({
        imageBlobPaths: announcements.imageBlobPaths,
        imageUrls: announcements.imageUrls,
      })
      .from(announcements)
      .where(and(eq(announcements.id, id), isNull(announcements.deletedAt)))
      .limit(1);

    const [item] = await db
      .update(announcements)
      .set(updateData)
      .where(
        and(eq(announcements.id, id), isNull(announcements.deletedAt))
      )
      .returning();

    if (!item) {
      throw new AdminApiError("해당 공지사항을 찾을 수 없습니다", {
        status: 404,
        detail: `ID ${id} 인 공지사항이 이미 삭제되었거나 존재하지 않습니다.`,
      });
    }

    // Delete blobs that were dropped from the gallery during this update
    if (existing) {
      const keep = new Set<string>([
        ...item.imageBlobPaths,
        ...item.imageUrls,
      ]);
      const removed = Array.from(
        new Set([...existing.imageBlobPaths, ...existing.imageUrls])
      ).filter((ref) => ref.length > 0 && !keep.has(ref));

      if (removed.length > 0) {
        try {
          await del(removed);
        } catch (err) {
          console.error("Blob cleanup failed on update", id, err);
        }
      }
    }

    revalidateTag(ANNOUNCEMENTS_TAG, "max");
    revalidateTag(`announcement:${id}`, "max");
    return NextResponse.json({ item });
  } catch (err) {
    return adminApiError(err, "announcements.update");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  const { id } = await params;

  try {
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
      throw new AdminApiError("해당 공지사항을 찾을 수 없습니다", {
        status: 404,
        detail: `ID ${id} 인 공지사항이 이미 삭제되었거나 존재하지 않습니다.`,
      });
    }

    // Clean up image blobs so storage cost doesn't grow with deleted posts.
    const blobRefs = Array.from(
      new Set([...item.imageBlobPaths, ...item.imageUrls])
    ).filter((ref): ref is string => typeof ref === "string" && ref.length > 0);

    if (blobRefs.length > 0) {
      try {
        await del(blobRefs);
      } catch (err) {
        // Don't fail the delete if Blob API hiccups — log and move on.
        console.error("Blob cleanup failed for announcement", id, err);
      }
    }

    revalidateTag(ANNOUNCEMENTS_TAG, "max");
    revalidateTag(`announcement:${id}`, "max");
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return adminApiError(err, "announcements.delete");
  }
}
