import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { count, eq, isNull, and, desc, gte } from "drizzle-orm";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const now = new Date();

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

  const [draftResult] = await db
    .select({ value: count() })
    .from(announcements)
    .where(
      and(
        eq(announcements.isPublished, false),
        isNull(announcements.deletedAt)
      )
    );

  const recent = await db
    .select()
    .from(announcements)
    .where(isNull(announcements.deletedAt))
    .orderBy(desc(announcements.updatedAt))
    .limit(5);

  const upcoming = await db
    .select()
    .from(announcements)
    .where(
      and(
        isNull(announcements.deletedAt),
        eq(announcements.isPublished, true),
        gte(announcements.eventStartAt, now)
      )
    )
    .orderBy(announcements.eventStartAt)
    .limit(5);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <h1 className="font-heading text-[26px] text-church-text">대시보드</h1>
        <Link href="/admin/announcements/new">
          <Button className="bg-church-text hover:bg-church-navy-light text-white cursor-pointer">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 공지
          </Button>
        </Link>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="전체" value={totalResult.value} />
        <StatCard label="게시중" value={publishedResult.value} tone="accent" />
        <StatCard label="초안" value={draftResult.value} tone="muted" />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mt-8">
        {/* Recent */}
        <section className="card-base overflow-hidden">
          <header className="flex items-center justify-between px-5 py-4 border-b border-church-border-soft">
            <h2 className="font-heading text-[15px] text-church-text">
              최근 수정
            </h2>
            <Link
              href="/admin/announcements"
              className="focus-ring text-xs text-church-muted hover:text-church-text rounded transition-colors"
            >
              전체 보기 →
            </Link>
          </header>
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-sm text-church-muted text-center">
              아직 공지사항이 없습니다
            </p>
          ) : (
            <ul>
              {recent.map((item) => (
                <li key={item.id} className="border-b border-church-border-soft last:border-b-0">
                  <Link
                    href={`/admin/announcements/${item.id}/edit`}
                    className="focus-ring flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-church-border-soft/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-church-text truncate">
                        {item.title}
                      </p>
                      <p className="label-mono mt-0.5">
                        {format(new Date(item.updatedAt), "M.d HH:mm", { locale: ko })}
                      </p>
                    </div>
                    {item.isPublished ? (
                      <span className="pill bg-emerald-50 text-emerald-700 shrink-0">
                        <span className="pill-dot" />
                        게시중
                      </span>
                    ) : (
                      <span className="pill bg-church-border-soft text-church-muted shrink-0">
                        <span className="pill-dot" />
                        초안
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upcoming */}
        <section className="card-base overflow-hidden">
          <header className="px-5 py-4 border-b border-church-border-soft">
            <h2 className="font-heading text-[15px] text-church-text">
              예정된 이벤트
            </h2>
          </header>
          {upcoming.length === 0 ? (
            <p className="px-5 py-10 text-sm text-church-muted text-center">
              예정된 이벤트가 없습니다
            </p>
          ) : (
            <ul>
              {upcoming.map((item) => (
                <li key={item.id} className="border-b border-church-border-soft last:border-b-0">
                  <Link
                    href={`/admin/announcements/${item.id}/edit`}
                    className="focus-ring flex items-center gap-3 px-5 py-3.5 hover:bg-church-border-soft/50 transition-colors"
                  >
                    {/* Date block */}
                    <div className="shrink-0 w-12 text-center">
                      <div className="label-mono leading-none">
                        {item.eventStartAt && format(new Date(item.eventStartAt), "MMM", { locale: ko })}
                      </div>
                      <div className="font-heading text-xl text-church-text leading-none mt-0.5">
                        {item.eventStartAt && format(new Date(item.eventStartAt), "d")}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-church-text truncate">
                        {item.title}
                      </p>
                      <p className="text-[12px] text-church-accent mt-0.5 font-medium">
                        {item.eventStartAt &&
                          format(
                            new Date(item.eventStartAt),
                            item.isAllDay ? "EEEE" : "EEEE · HH:mm",
                            { locale: ko }
                          )}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "accent" | "muted";
}) {
  return (
    <div className="card-base p-4 sm:p-5">
      <p className="label-mono">{label}</p>
      <p
        className={`font-heading text-[28px] sm:text-[32px] mt-1 leading-none ${
          tone === "accent"
            ? "text-church-accent"
            : tone === "muted"
            ? "text-church-muted"
            : "text-church-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
