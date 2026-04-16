import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ShareButton } from "@/components/public/share-button";
import { ImageCarousel } from "@/components/public/image-carousel";
import { ViewTracker } from "@/components/public/view-tracker";
import { getPublishedAnnouncementById } from "@/server/data/announcements";

export const revalidate = 3600;

const getAnnouncement = getPublishedAnnouncementById;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getAnnouncement(id);
  if (!item) return { title: "공지사항" };

  const plainText = item.bodyHtml
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);

  return {
    title: `${item.title} · 정동 젊은이 교회`,
    description: plainText || "정동 젊은이 교회 공지사항",
    openGraph: {
      title: item.title,
      description: plainText,
      type: "article",
      images: item.imageUrls.length > 0
        ? item.imageUrls.map((url) => ({ url }))
        : undefined,
    },
  };
}

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getAnnouncement(id);
  if (!item) notFound();

  const isHighPriority = item.priority >= 10;
  const hasEventDate = item.showOnCalendar && item.eventStartAt;

  return (
    <article>
      <ViewTracker announcementId={item.id} />
      {/* Top bar — back link + share */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="focus-ring inline-flex items-center gap-1 min-h-11 text-sm text-church-muted hover:text-church-text rounded-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          공지사항
        </Link>
        <ShareButton title={item.title} />
      </div>

      {/* Image gallery */}
      {item.imageUrls.length > 0 && (
        <ImageCarousel
          images={item.imageUrls}
          alt={item.title}
          aspect={item.imageAspect as import("@/server/validation/announcement").ImageAspect}
          fit={item.imageFit as import("@/server/validation/announcement").ImageFit}
          focals={item.imageFocals}
        />
      )}

      {/* Meta */}
      {(isHighPriority || hasEventDate) && (
        <div className="flex items-center flex-wrap gap-2 mb-3">
          {isHighPriority && (
            <span className="pill bg-red-50 text-church-crimson">
              <span className="pill-dot" />
              중요
            </span>
          )}
          {hasEventDate && (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-church-accent font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <time>
                {format(
                  new Date(item.eventStartAt!),
                  item.isAllDay ? "M월 d일 (EEE)" : "M월 d일 HH:mm",
                  { locale: ko }
                )}
              </time>
              {item.eventEndAt && (
                <>
                  <span className="text-church-muted/60" aria-hidden="true">→</span>
                  <time>
                    {format(
                      new Date(item.eventEndAt),
                      item.isAllDay ? "M월 d일 (EEE)" : "M월 d일 HH:mm",
                      { locale: ko }
                    )}
                  </time>
                </>
              )}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h1 className="font-heading text-[28px] sm:text-[32px] text-church-text leading-[1.2] break-keep">
        {item.title}
      </h1>

      {/* Posted date */}
      <p className="mt-2 text-xs text-church-muted">
        {format(new Date(item.startAt), "yyyy년 M월 d일 (EEE)", { locale: ko })}
      </p>

      {/* Body */}
      <div
        className="announcement-content mt-6 text-[15px] text-church-text/85 leading-[1.8]"
        dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
      />

      {/* Action row — only when there's an external link */}
      {item.linkUrl && (
        <div className="mt-8 pt-6 border-t border-church-border">
          <a
            href={item.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-1.5 min-h-11 px-4 rounded-lg bg-church-text text-church-surface text-sm font-medium hover:bg-church-navy-light transition-colors"
          >
            자세히 보기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </article>
  );
}
