import Link from "next/link";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { desc, isNull } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnnouncementTable } from "@/components/admin/announcement-table";
import { PriorityDndList } from "@/components/admin/priority-dnd-list";

export default async function AdminAnnouncementsPage() {
  const items = await db
    .select()
    .from(announcements)
    .where(isNull(announcements.deletedAt))
    .orderBy(desc(announcements.priority), desc(announcements.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-church-navy">
          공지사항 관리
        </h1>
        <Link href="/admin/announcements/new">
          <Button className="bg-church-navy hover:bg-church-navy/90">
            새 공지 작성
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">목록</TabsTrigger>
          <TabsTrigger value="priority">우선순위 정렬</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <AnnouncementTable announcements={items} />
        </TabsContent>
        <TabsContent value="priority" className="mt-4">
          <PriorityDndList announcements={items} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
