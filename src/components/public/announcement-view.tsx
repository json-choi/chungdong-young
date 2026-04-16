"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { AnnouncementListItem as AnnouncementListItemData } from "./types";
import { AnnouncementListItem } from "./announcement-list-item";

// Lazy-load calendar (react-day-picker + date-fns locale) — only loaded when user switches tab
const CalendarView = dynamic(
  () => import("./calendar-view").then((m) => m.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="py-24 text-center text-sm text-church-muted">
        불러오는 중…
      </div>
    ),
  }
);

type ViewMode = "feed" | "calendar";

interface AnnouncementViewProps {
  items: AnnouncementListItemData[];
  archivedItems: AnnouncementListItemData[];
  calendarItems: AnnouncementListItemData[];
}

export function AnnouncementView({
  items,
  archivedItems,
  calendarItems,
}: AnnouncementViewProps) {
  const [view, setView] = useState<ViewMode>("feed");
  const [showArchive, setShowArchive] = useState(false);
  const firstImageItemId = items.find((item) => item.imageUrls.length > 0)?.id;

  return (
    <div>
      {/* Underlined tabs — desktop/tablet only */}
      <div
        role="tablist"
        aria-label="보기 방식"
        className="hidden sm:flex items-center gap-6 border-b border-church-border mb-6"
      >
        {([
          { id: "feed", label: "피드", count: items.length },
          { id: "calendar", label: "달력", count: calendarItems.length },
        ] as const).map((tab) => {
          const isActive = view === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setView(tab.id)}
              className={`focus-ring relative inline-flex items-center gap-2 py-3 -mb-px border-b-2 text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? "border-church-text text-church-text"
                  : "border-transparent text-church-muted hover:text-church-text"
              }`}
            >
              {tab.label}
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold ${
                  isActive
                    ? "bg-church-text text-church-surface"
                    : "bg-church-border-soft text-church-muted"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {view === "feed" ? (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <AnnouncementListItem
              key={item.id}
              announcement={item}
              priority={item.id === firstImageItemId || (!firstImageItemId && idx === 0)}
            />
          ))}

          {/* Archive */}
          {archivedItems.length > 0 && (
            <div className="pt-6 mt-4 border-t border-church-border">
              <button
                onClick={() => setShowArchive((v) => !v)}
                aria-expanded={showArchive}
                className="focus-ring w-full flex items-center justify-center gap-2 min-h-[44px] py-3 text-sm font-medium text-church-muted hover:text-church-text transition-colors cursor-pointer rounded-lg"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showArchive ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                지난 공지 ({archivedItems.length})
              </button>

              {showArchive && (
                <div className="space-y-2 mt-3">
                  {archivedItems.map((item) => (
                    <AnnouncementListItem
                      key={item.id}
                      announcement={item}
                      isArchived
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <CalendarView items={calendarItems} />
      )}

      {/* Mobile bottom glass nav */}
      <nav
        role="tablist"
        aria-label="보기 방식"
        className="sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Ambient halo — gives the glass something to refract even when the
            page content directly behind is plain. Positioned behind the pill
            and blurred heavily so it reads as diffused light, not a shape. */}
        <div
          aria-hidden="true"
          className="glass-halo pointer-events-none absolute inset-x-[-24px] -top-5 -bottom-5 -z-10"
        />

        <div className="glass-pill relative flex items-center gap-1 p-1 rounded-full">
          <button
            role="tab"
            aria-selected={view === "feed"}
            aria-label="피드 보기"
            onClick={() => setView("feed")}
            className={`focus-ring inline-flex items-center gap-1.5 min-h-[44px] px-5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              view === "feed"
                ? "bg-church-text text-church-surface"
                : "text-church-muted hover:text-church-text"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            피드
          </button>
          <button
            role="tab"
            aria-selected={view === "calendar"}
            aria-label="달력 보기"
            onClick={() => setView("calendar")}
            className={`focus-ring inline-flex items-center gap-1.5 min-h-[44px] px-5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              view === "calendar"
                ? "bg-church-text text-church-surface"
                : "text-church-muted hover:text-church-text"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            달력
          </button>
        </div>
      </nav>
    </div>
  );
}
