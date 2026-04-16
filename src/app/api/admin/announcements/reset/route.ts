import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isNotNull } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { getAdminSession, unauthorizedResponse } from "@/server/auth/guard";
import { ANNOUNCEMENTS_TAG } from "@/server/data/announcements";
import { adminApiError } from "@/server/api/errors";

// Hard-delete ALL announcements and clean up associated Vercel Blob assets.
export async function POST() {
  if (!(await getAdminSession())) return unauthorizedResponse();

  try {
    const rows = await db
      .select({
        id: announcements.id,
        imageUrls: announcements.imageUrls,
        imageBlobPaths: announcements.imageBlobPaths,
      })
      .from(announcements);

    const blobRefs = Array.from(
      new Set(
        rows.flatMap((row) => [...row.imageBlobPaths, ...row.imageUrls])
      )
    ).filter((value) => Boolean(value));

    await db.delete(announcements).where(isNotNull(announcements.id));

    let blobCleanupError: string | null = null;

    if (blobRefs.length > 0) {
      try {
        await del(blobRefs);
      } catch (err) {
        blobCleanupError =
          err instanceof Error ? err.message : "Unknown blob error";
        console.error("[admin:announcements.reset] blob cleanup failed", err);
      }
    }

    revalidateTag(ANNOUNCEMENTS_TAG, "max");

    return NextResponse.json({
      success: true,
      deleted: rows.length,
      blobsDeleted: blobCleanupError ? 0 : blobRefs.length,
      blobCleanupError,
    });
  } catch (err) {
    return adminApiError(err, "announcements.reset");
  }
}
