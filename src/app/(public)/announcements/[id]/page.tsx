import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ko } from "date-fns/locale";
import { formatKst } from "@/lib/datetime";
import { ShareButton } from "@/components/public/share-button";
import { ImageCarousel } from "@/components/public/image-carousel";
import { ViewTracker } from "@/components/public/view-tracker";
import { getPublishedAnnouncementById } from "@/server/data/announcements";

export const revalidate = 3600;

const getAnnouncement = getPublishedAnnouncementById;

function extractYouTubeUrl(text: string): string | null {
    const normalized = text.replace(/&amp;/g, "&");

    const single = normalized.match(
        /https?:\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com\/watch\?[^"'\s<>]*v=[A-Za-z0-9_-]{11}|youtu\.be\/[A-Za-z0-9_-]{11}[^"'\s<>]*|youtube(?:-nocookie)?\.com\/(?:embed|shorts|v)\/(?!videoseries)[A-Za-z0-9_-]{11}[^"'\s<>]*)/,
    );
    if (single) return single[0];

    const playlistEmbed = normalized.match(
        /https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/videoseries\?[^"'\s<>]*list=([A-Za-z0-9_-]+)/,
    );
    if (playlistEmbed) return `https://www.youtube.com/playlist?list=${playlistEmbed[1]}`;

    const playlistUrl = normalized.match(
        /https?:\/\/(?:www\.)?youtube\.com\/playlist\?[^"'\s<>]*list=[A-Za-z0-9_-]+[^"'\s<>]*/,
    );
    if (playlistUrl) return playlistUrl[0];

    return null;
}

async function fetchYouTubeThumb(url: string): Promise<string | null> {
    try {
        const r = await fetch(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
            { next: { revalidate: 86400 } },
        );
        if (!r.ok) return null;
        const j = (await r.json()) as { thumbnail_url?: string };
        return j.thumbnail_url ?? null;
    } catch {
        return null;
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const item = await getAnnouncement(id);
    if (!item) return { title: "공지사항" };

    const plainText = item.bodyHtml
        .replace(/<\/?(p|div|br|li|h[1-6]|tr)[^>]*>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[ \t]+/g, " ")
        .replace(/[ \t]*\n[ \t]*/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, 280);

    const description = plainText || "정동 젊은이 교회 공지사항";
    const canonicalPath = `/announcements/${item.id}`;

    const youtubeUrl =
        (item.linkUrl ? extractYouTubeUrl(item.linkUrl) : null) ??
        extractYouTubeUrl(item.bodyHtml);
    const fallbackImage = youtubeUrl ? await fetchYouTubeThumb(youtubeUrl) : null;
    const images =
        item.imageUrls.length > 0
            ? item.imageUrls.map((url) => ({ url }))
            : fallbackImage
              ? [{ url: fallbackImage }]
              : undefined;

    const toIso = (v: Date | string | null | undefined): string | undefined => {
        if (!v) return undefined;
        const d = v instanceof Date ? v : new Date(v);
        return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
    };

    return {
        title: `${item.title}`,
        description,
        alternates: { canonical: canonicalPath },
        openGraph: {
            title: item.title,
            description,
            type: "article",
            url: canonicalPath,
            siteName: "정동 젊은이 교회",
            locale: "ko_KR",
            publishedTime: toIso(item.startAt),
            modifiedTime: toIso(item.updatedAt),
            images,
        },
        twitter: {
            card: "summary_large_image",
            title: item.title,
            description,
            images: images?.map((i) => i.url),
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
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
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
                    aspect={
                        item.imageAspect as import("@/server/validation/announcement").ImageAspect
                    }
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
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <time>
                                {formatKst(
                                    item.eventStartAt!,
                                    item.isAllDay ? "M월 d일 (EEE)" : "M월 d일 HH:mm",
                                    { locale: ko },
                                )}
                            </time>
                            {item.eventEndAt && (
                                <>
                                    <span className="text-church-muted/60" aria-hidden="true">
                                        →
                                    </span>
                                    <time>
                                        {formatKst(
                                            item.eventEndAt,
                                            item.isAllDay ? "M월 d일 (EEE)" : "M월 d일 HH:mm",
                                            { locale: ko },
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
                {formatKst(item.startAt, "yyyy년 M월 d일 (EEE)", { locale: ko })}
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
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
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
        </article>
    );
}
