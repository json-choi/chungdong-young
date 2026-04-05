"use client";

import { useState } from "react";
import type { Announcement } from "@/server/db/schema";
import { AnnouncementCard } from "./announcement-card";
import { CalendarView } from "./calendar-view";

type ViewMode = "feed" | "calendar";

interface AnnouncementViewProps {
  items: Announcement[];
  archivedItems: Announcement[];
  calendarItems: Announcement[];
}

export function AnnouncementView({
  items,
  archivedItems,
  calendarItems,
}: AnnouncementViewProps) {
  const [view, setView] = useState<ViewMode>("feed");
  const [showArchive, setShowArchive] = useState(false);

  return (
    <div>
      {/* View Toggle */}
      <div className="flex items-center justify-end mb-5">
        <div className="inline-flex rounded-lg border border-church-border bg-white p-0.5">
          <button
            onClick={() => setView("feed")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "feed"
                ? "bg-church-navy text-white"
                : "text-church-muted hover:text-church-text"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            피드
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "calendar"
                ? "bg-church-navy text-white"
                : "text-church-muted hover:text-church-text"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            달력
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "feed" ? (
        <div className="space-y-5">
          {items.map((item, index) => (
            <AnnouncementCard key={item.id} announcement={item} isLcp={index === 0} />
          ))}

          {/* Archive */}
          {archivedItems.length > 0 && (
            <div className="pt-4">
              <button
                onClick={() => setShowArchive((v) => !v)}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-church-muted hover:text-church-text transition-colors"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showArchive ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                지난 공지 ({archivedItems.length})
              </button>

              {showArchive && (
                <div className="space-y-5 mt-3">
                  {archivedItems.map((item) => (
                    <div key={item.id} className="opacity-60">
                      <AnnouncementCard announcement={item} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <CalendarView items={calendarItems} />
      )}
    </div>
  );
}
