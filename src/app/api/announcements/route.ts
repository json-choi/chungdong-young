import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { and, eq, isNull, lte, or, gte, desc } from "drizzle-orm";

export async function GET() {
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

  return NextResponse.json({ items });
}
