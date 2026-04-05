import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import type { Announcement } from "@/server/db/schema";

interface AnnouncementCardProps {
  announcement: Announcement;
  isLcp?: boolean;
}

export function AnnouncementCard({ announcement, isLcp }: AnnouncementCardProps) {
  const isHighPriority = announcement.priority >= 10;

  return (
    <article className="card-base overflow-hidden">
      {/* Image */}
      {announcement.imageUrl && (
        <div className="relative w-full aspect-2/1 bg-church-bg">
          <Image
            src={announcement.imageUrl}
            alt={announcement.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 600px"
            priority={isLcp}
          />
        </div>
      )}

      <div className="p-5 sm:p-6">
        {/* Date — only for calendar events, using event dates */}
        {announcement.showOnCalendar && announcement.eventStartAt && (
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs mb-3">
            <span className="inline-flex items-center gap-1 text-church-text/60 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <time>
                {format(
                  new Date(announcement.eventStartAt),
                  announcement.isAllDay ? "M.dd (EEE)" : "M.dd (EEE) HH:mm",
                  { locale: ko }
                )}
              </time>
              {announcement.eventEndAt && (
                <>
                  <span className="text-church-text/40 font-bold mx-0.5">&rarr;</span>
                  <time>
                    {format(
                      new Date(announcement.eventEndAt),
                      announcement.isAllDay ? "M.dd (EEE)" : "M.dd (EEE) HH:mm",
                      { locale: ko }
                    )}
                  </time>
                </>
              )}
            </span>
          </div>
        )}

        {/* Title */}
        <h2 className="text-lg font-semibold text-church-text leading-snug break-keep">
          {isHighPriority && (
            <span className="inline-block text-[11px] font-bold px-1.5 py-0.5 rounded bg-church-crimson text-white mr-2 align-middle -translate-y-px">
              중요
            </span>
          )}
          {announcement.title}
        </h2>

        {/* Content */}
        <div
          className="announcement-content mt-3 text-sm text-church-text/75 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: announcement.bodyHtml }}
        />

        {/* Link */}
        {announcement.linkUrl && (
          <div className="mt-4">
            <a
              href={announcement.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-church-navy hover:text-church-navy-light transition-colors"
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
    </article>
  );
}
