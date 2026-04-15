import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isNotNull } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { getAdminSession, unauthorizedResponse } from "@/server/auth/guard";
import { ANNOUNCEMENTS_TAG } from "@/server/data/announcements";

// Hard-delete ALL announcements and clean up associated Vercel Blob assets.
export async function POST() {
  if (!(await getAdminSession())) return unauthorizedResponse();

  const rows = await db
    .select({
      id: announcements.id,
      imageUrl: announcements.imageUrl,
      imageBlobPath: announcements.imageBlobPath,
    })
    .from(announcements);

  const blobRefs = Array.from(
    new Set(
      rows.flatMap((row) =>
        [row.imageBlobPath, row.imageUrl].filter(
          (value): value is string => Boolean(value)
        )
      )
    )
  );

  await db.delete(announcements).where(isNotNull(announcements.id));

  let blobCleanupError = false;

  if (blobRefs.length > 0) {
    try {
      await del(blobRefs);
    } catch {
      blobCleanupError = true;
    }
  }

  revalidateTag(ANNOUNCEMENTS_TAG, "max");

  return NextResponse.json({
    success: true,
    deleted: rows.length,
    blobsDeleted: blobRefs.length,
    blobCleanupError,
  });
}
