import Link from "next/link";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { desc, isNull } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnnouncementTable } from "@/components/admin/announcement-table";
import { PriorityDndList } from "@/components/admin/priority-dnd-list";
import { PageHeader } from "@/components/admin/page-header";

export default async function AdminAnnouncementsPage() {
  const items = await db
    .select()
    .from(announcements)
    .where(isNull(announcements.deletedAt))
    .orderBy(desc(announcements.priority), desc(announcements.createdAt));

  return (
    <div>
      <PageHeader
        title="공지사항"
        meta={`${items.length}건`}
        description="공지 목록을 관리하고 우선순위를 조정합니다."
        actions={
          <Link href="/admin/announcements/new">
            <Button className="bg-church-text hover:bg-church-navy-light text-church-surface cursor-pointer">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 공지
            </Button>
          </Link>
        }
      />

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
