import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { announcements, announcementViews } from "@/server/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

function visitorHash(req: NextRequest): string {
  const ip = clientIp(req);
  const ua = req.headers.get("user-agent") ?? "";
  const salt = process.env.BETTER_AUTH_SECRET ?? "";
  return createHash("sha256").update(`${ip}::${ua}::${salt}`).digest("hex");
}

// Returns the UTC date part (YYYY-MM-DD) used as the dedup bucket.
function todayBucket(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const hash = visitorHash(request);
  const bucket = todayBucket();

  try {
    const inserted = await db
      .insert(announcementViews)
      .values({
        announcementId: id,
        visitorHash: hash,
        viewedDate: bucket,
      })
      .onConflictDoNothing()
      .returning({ announcementId: announcementViews.announcementId });

    let counted = false;
    if (inserted.length > 0) {
      const result = await db
        .update(announcements)
        .set({ viewCount: sql`${announcements.viewCount} + 1` })
        .where(sql`${announcements.id} = ${id} AND ${announcements.deletedAt} IS NULL`)
        .returning({ viewCount: announcements.viewCount });
      counted = result.length > 0;
    }

    return NextResponse.json({ ok: true, counted });
  } catch (err) {
    // A 23503 means the announcement was deleted between dedup insert and
    // counter update — silently no-op. Any other failure is logged but
    // shouldn't disturb the reader's page view.
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code?: unknown }).code)
        : undefined;
    if (code !== "23503") {
      console.error("[announcement-views] failed", { id, err });
    }
    return NextResponse.json({ ok: true, counted: false });
  }
}
