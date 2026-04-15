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
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="font-heading text-[26px] text-church-text">
          공지사항 <span className="text-church-muted font-normal">· {items.length}</span>
        </h1>
        <Link href="/admin/announcements/new">
          <Button className="bg-church-text hover:bg-church-navy-light text-white cursor-pointer">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 공지
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list" className="cursor-pointer">목록</TabsTrigger>
          <TabsTrigger value="priority" className="cursor-pointer">우선순위 정렬</TabsTrigger>
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
