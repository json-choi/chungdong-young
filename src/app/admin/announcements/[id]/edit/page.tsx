import { notFound } from "next/navigation";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { AnnouncementForm } from "@/components/admin/announcement-form";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [announcement] = await db
    .select()
    .from(announcements)
    .where(and(eq(announcements.id, id), isNull(announcements.deletedAt)));

  if (!announcement) {
    notFound();
  }

  return (
    <div>
      <AnnouncementForm announcement={announcement} />
    </div>
  );
}
