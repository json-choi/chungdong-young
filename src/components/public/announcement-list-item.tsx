import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { AnnouncementListItem as AnnouncementListItemData } from "./types";

interface AnnouncementListItemProps {
  announcement: AnnouncementListItemData;
  isArchived?: boolean;
  priority?: boolean;
}

export function AnnouncementListItem({
  announcement,
  isArchived,
  priority,
}: AnnouncementListItemProps) {
  const isHighPriority = announcement.priority >= 10;
  const hasEventDate =
    announcement.showOnCalendar && announcement.eventStartAt;

  return (
    <Link
      href={`/announcements/${announcement.id}`}
      aria-label={announcement.title}
      className={`focus-ring group flex items-center gap-3 p-3 rounded-xl border border-church-border bg-church-surface transition-colors hover:border-church-muted/30 hover:bg-church-border-soft/40 ${
        isArchived ? "opacity-70" : ""
      }`}
    >
      {/* Thumbnail or priority bar */}
      {announcement.imageUrls[0] ? (
        <div className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-church-border-soft">
          {priority ? (
            <Image
              src={announcement.imageUrls[0]}
              alt=""
              fill
              sizes="56px"
              loading="eager"
              fetchPriority="high"
              className="object-cover"
            />
          ) : (
            <Image
              src={announcement.imageUrls[0]}
              alt=""
              fill
              sizes="56px"
              loading="lazy"
              className="object-cover"
            />
          )}
        </div>
      ) : (
        <div
          className={`shrink-0 w-1 h-12 rounded-full ${
            isHighPriority ? "bg-church-crimson" : "bg-church-border"
          }`}
          aria-hidden="true"
        />
      )}

      {/* Body */}
      <div className="min-w-0 flex-1">
        <h2 className="font-heading text-[15px] text-church-text leading-snug line-clamp-2 break-keep group-hover:text-church-accent transition-colors">
          {announcement.title}
        </h2>
        <div className="flex items-center gap-1.5 mt-1 text-[12px] text-church-muted">
          {isHighPriority && (
            <span className="inline-flex items-center gap-1 text-church-crimson font-medium">
              <span className="w-1 h-1 rounded-full bg-church-crimson" aria-hidden="true" />
              중요
            </span>
          )}
          {isHighPriority && hasEventDate && (
            <span aria-hidden="true">·</span>
          )}
          {hasEventDate && (
            <time className="text-church-accent font-medium">
              {format(
                new Date(announcement.eventStartAt!),
                announcement.isAllDay ? "M.d (EEE)" : "M.d HH:mm",
                { locale: ko }
              )}
            </time>
          )}
        </div>
      </div>

      {/* Chevron */}
      <svg
        className="shrink-0 w-4 h-4 text-church-muted/60 group-hover:text-church-text group-hover:translate-x-0.5 transition-all"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
