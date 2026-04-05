import Link from "next/link";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { count, eq, isNull, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const [totalResult] = await db
    .select({ value: count() })
    .from(announcements)
    .where(isNull(announcements.deletedAt));

  const [publishedResult] = await db
    .select({ value: count() })
    .from(announcements)
    .where(
      and(
        eq(announcements.isPublished, true),
        isNull(announcements.deletedAt)
      )
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-church-navy">대시보드</h1>
        <Link href="/admin/announcements/new">
          <Button className="bg-church-navy hover:bg-church-navy/90">
            새 공지 작성
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-church-muted">
              전체 공지
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-church-navy">
              {totalResult.value}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-church-muted">
              게시 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-church-navy">
              {publishedResult.value}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
