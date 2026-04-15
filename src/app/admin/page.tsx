import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { db } from "@/server/db/client";
import { announcements } from "@/server/db/schema";
import { count, eq, isNull, and, desc, gte, lte } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";

export default async function AdminDashboardPage() {
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

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

  const [thisWeekResult] = await db
    .select({ value: count() })
    .from(announcements)
    .where(
      and(
        isNull(announcements.deletedAt),
        eq(announcements.isPublished, true),
        gte(announcements.eventStartAt, now),
        lte(announcements.eventStartAt, weekEnd)
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
      <PageHeader
        title="대시보드"
        description="공지사항 현황과 최근 변경사항을 한눈에 확인합니다."
        actions={
          <Link href="/admin/announcements/new">
            <Button className="bg-church-text hover:bg-church-navy-light text-white cursor-pointer">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 공지
            </Button>
          </Link>
        }
      />

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="전체"
          value={totalResult.value}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          }
        />
        <StatCard
          label="게시중"
          value={publishedResult.value}
          tone="accent"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
        <StatCard
          label="초안"
          value={draftResult.value}
          tone="muted"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
        <StatCard
          label="이번 주 예정"
          value={thisWeekResult.value}
          tone="warm"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mt-8">
        {/* Recent */}
        <section className="card-base overflow-hidden">
          <header className="flex items-center justify-between px-5 py-4 border-b border-church-border-soft">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-church-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="font-heading text-[15px] text-church-text">
                최근 수정
              </h2>
            </div>
            <Link
              href="/admin/announcements"
              className="focus-ring text-xs text-church-muted hover:text-church-text rounded transition-colors"
            >
              전체 보기 →
            </Link>
          </header>
          {recent.length === 0 ? (
            <EmptyState
              title="아직 공지사항이 없습니다"
              hint="첫 공지를 작성해 보세요"
            />
          ) : (
            <ul>
              {recent.map((item) => (
                <li key={item.id} className="border-b border-church-border-soft last:border-b-0">
                  <Link
                    href={`/admin/announcements/${item.id}/edit`}
                    className="focus-ring flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-church-border-soft/50 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-church-text truncate">
                        {item.title}
                      </p>
                      <p className="label-mono mt-0.5 tabular-nums">
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
          <header className="flex items-center justify-between px-5 py-4 border-b border-church-border-soft">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-church-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="font-heading text-[15px] text-church-text">
                예정된 이벤트
              </h2>
            </div>
          </header>
          {upcoming.length === 0 ? (
            <EmptyState
              title="예정된 이벤트가 없습니다"
              hint="공지에 날짜를 입력하면 여기에 표시됩니다"
            />
          ) : (
            <ul>
              {upcoming.map((item) => (
                <li key={item.id} className="border-b border-church-border-soft last:border-b-0">
                  <Link
                    href={`/admin/announcements/${item.id}/edit`}
                    className="focus-ring flex items-center gap-3 px-5 py-3.5 hover:bg-church-border-soft/50 transition-colors cursor-pointer"
                  >
                    {/* Date block */}
                    <div className="shrink-0 w-12 text-center">
                      <div className="label-mono leading-none">
                        {item.eventStartAt && format(new Date(item.eventStartAt), "MMM", { locale: ko })}
                      </div>
                      <div className="font-heading text-xl text-church-text leading-none mt-0.5 tabular-nums">
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

interface StatCardProps {
  label: string;
  value: number;
  tone?: "accent" | "muted" | "warm";
  icon: React.ReactNode;
}

function StatCard({ label, value, tone, icon }: StatCardProps) {
  const valueColor =
    tone === "accent"
      ? "text-church-accent"
      : tone === "muted"
      ? "text-church-muted"
      : tone === "warm"
      ? "text-amber-600"
      : "text-church-text";

  const iconBg =
    tone === "accent"
      ? "bg-church-accent-soft text-church-accent"
      : tone === "warm"
      ? "bg-amber-50 text-amber-600"
      : tone === "muted"
      ? "bg-church-border-soft text-church-muted"
      : "bg-church-border-soft text-church-text";

  return (
    <div className="card-base p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="label-mono">{label}</p>
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${iconBg}`}
          aria-hidden="true"
        >
          <span className="w-4 h-4 block">{icon}</span>
        </span>
      </div>
      <p
        className={`font-heading text-[28px] sm:text-[32px] mt-2 leading-none tabular-nums ${valueColor}`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-medium text-church-text">{title}</p>
      <p className="text-[13px] text-church-muted mt-1">{hint}</p>
    </div>
  );
}
