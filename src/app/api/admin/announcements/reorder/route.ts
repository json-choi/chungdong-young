import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { getAdminSession, unauthorizedResponse } from "@/server/auth/guard";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { ANNOUNCEMENTS_TAG } from "@/server/data/announcements";
import { adminApiError } from "@/server/api/errors";

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      priority: z.number().int().min(0),
    })
  ),
});

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = reorderSchema.parse(body);

    for (const item of parsed.items) {
      await db
        .update(announcements)
        .set({
          priority: item.priority,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(announcements.id, item.id));
    }

    revalidateTag(ANNOUNCEMENTS_TAG, "max");
    return NextResponse.json({ success: true });
  } catch (err) {
    return adminApiError(err, "announcements.reorder");
  }
}
