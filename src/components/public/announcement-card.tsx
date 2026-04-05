import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import type { Announcement } from "@/server/db/schema";

interface AnnouncementCardProps {
  announcement: Announcement;
}

function getStatusInfo(startAt: Date, endAt: Date | null) {
  const now = new Date();
  const start = new Date(startAt);

  if (start > now) {
    return { label: "예정", variant: "upcoming" as const };
  }

  if (endAt) {
    const end = new Date(endAt);
    if (end < now) {
      return { label: "종료", variant: "ended" as const };
    }
  }

  return { label: "진행중", variant: "ongoing" as const };
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const isHighPriority = announcement.priority >= 10;
  const status = getStatusInfo(announcement.startAt, announcement.endAt);

  return (
    <article className="bg-white rounded-lg border border-church-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex">
        {/* Priority color bar */}
        <div
          className={`w-1 shrink-0 ${
            isHighPriority ? "bg-church-crimson" : "bg-church-navy"
          }`}
        />

        <div className="flex-1 min-w-0">
          {/* Image */}
          {announcement.imageUrl && (
            <div className="relative w-full aspect-2/1 bg-gray-100">
              <Image
                src={announcement.imageUrl}
                alt={announcement.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 600px"
                priority={false}
              />
            </div>
          )}

          <div className="p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2 className="text-lg font-semibold text-church-text leading-snug break-keep">
                {announcement.title}
              </h2>
              {isHighPriority && (
                <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded bg-church-crimson/10 text-church-crimson">
                  중요
                </span>
              )}
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2 text-sm text-church-muted mb-3">
              <time>
                {format(new Date(announcement.startAt), "yyyy.MM.dd (EEE)", {
                  locale: ko,
                })}
              </time>
              {announcement.endAt && (
                <>
                  <span>-</span>
                  <time>
                    {format(new Date(announcement.endAt), "yyyy.MM.dd (EEE)", {
                      locale: ko,
                    })}
                  </time>
                </>
              )}
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  status.variant === "ongoing"
                    ? "bg-church-navy/10 text-church-navy"
                    : status.variant === "upcoming"
                    ? "bg-gray-100 text-church-muted"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {status.label}
              </span>
            </div>

            {/* Content */}
            <div
              className="announcement-content text-sm text-church-text/85 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: announcement.bodyHtml }}
            />

            {/* Link */}
            {announcement.linkUrl && (
              <div className="mt-3 pt-3 border-t border-church-border">
                <a
                  href={announcement.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-church-navy hover:underline"
                  aria-label={`자세히 보기: ${announcement.title}`}
                >
                  <span>자세히 보기</span>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
