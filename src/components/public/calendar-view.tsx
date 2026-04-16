"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  differenceInCalendarDays,
} from "date-fns";
import { ko } from "date-fns/locale";
import { toKstDate } from "@/lib/datetime";
import type { AnnouncementListItem as Announcement } from "./types";

interface CalendarViewProps {
  items: Announcement[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MAX_VISIBLE_LANES = 3;
const MAX_MOBILE_DOTS = 4;

const EVENT_COLORS = [
  "bg-blue-500 text-white",
  "bg-emerald-500 text-white",
  "bg-rose-500 text-white",
  "bg-amber-500 text-white",
  "bg-violet-500 text-white",
  "bg-teal-500 text-white",
];

// Dot colors mirror EVENT_COLORS bg — extract raw class for small dot markers
const DOT_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-teal-500",
];

/** Stable color per event id (not index) — prevents color reshuffling
 *  when the items list changes. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

interface EventSegment {
  item: Announcement;
  startCol: number; // 0-based column in the week (0=Sun)
  span: number; // how many columns
  lane: number; // which row in the event area
  colorClass: string;
  continuesFromPrev: boolean;
  continuesToNext: boolean;
}

// Input is a KST-zoned Date (see `toKstDate`). We mutate a copy with local
// setters — on a zoned Date those setters operate on the KST wall-clock, so
// the result stays in the same "zoned" coordinate system and compares
// correctly against other zoned Dates.
function dayStart(d: Date): Date {
  const x = new Date(d.getTime());
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayEnd(d: Date): Date {
  const x = new Date(d.getTime());
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Get the effective event start/end for calendar display, projected to KST.
 *  All calendar math (day boundaries, grid positions, formatting) runs in KST
 *  via zoned Dates — so users abroad still see Korean-church calendar days. */
function eventStart(item: Announcement): Date {
  return toKstDate(item.eventStartAt ?? item.startAt);
}
function eventEnd(item: Announcement): Date {
  return toKstDate(item.eventEndAt ?? item.eventStartAt ?? item.startAt);
}

function computeWeekSegments(
  weekDays: Date[],
  items: Announcement[],
  colorMap: Map<string, string>,
  laneMemory: Map<string, number>
): EventSegment[] {
  const wkStart = dayStart(weekDays[0]);
  const wkEnd = dayEnd(weekDays[6]);

  const relevant = items.filter((item) => {
    const s = dayStart(eventStart(item));
    const e = dayEnd(eventEnd(item));
    return s <= wkEnd && e >= wkStart;
  });

  // Sort: longer events first, then by start date
  const sorted = [...relevant].sort((a, b) => {
    const aDur = differenceInCalendarDays(eventEnd(a), eventStart(a));
    const bDur = differenceInCalendarDays(eventEnd(b), eventStart(b));
    if (bDur !== aDur) return bDur - aDur;
    return eventStart(a).getTime() - eventStart(b).getTime();
  });

  // Track occupied lanes per column
  const occupied: boolean[][] = Array.from({ length: 7 }, () => []);
  const segments: EventSegment[] = [];

  // Helper: find free lane for a column range and occupy it
  function placeSeg(startCol: number, endCol: number, preferLane?: number): number {
    let lane = preferLane ?? -1;
    if (lane >= 0) {
      for (let c = startCol; c <= endCol; c++) {
        if (occupied[c][lane]) { lane = -1; break; }
      }
    }
    if (lane < 0) {
      lane = 0;
      while (true) {
        let free = true;
        for (let c = startCol; c <= endCol; c++) {
          if (occupied[c][lane]) { free = false; break; }
        }
        if (free) break;
        lane++;
      }
    }
    for (let c = startCol; c <= endCol; c++) {
      occupied[c][lane] = true;
    }
    return lane;
  }

  for (const item of sorted) {
    const evStart = dayStart(eventStart(item));
    const evEnd = dayEnd(eventEnd(item));

    const clampedStart = evStart < wkStart ? wkStart : evStart;
    const clampedEnd = evEnd > wkEnd ? wkEnd : evEnd;

    const startCol = differenceInCalendarDays(clampedStart, wkStart);
    const endCol = differenceInCalendarDays(clampedEnd, wkStart);
    const totalSpan = endCol - startCol + 1;

    const colorClass = colorMap.get(item.id) ?? EVENT_COLORS[0];

    // isAllDay events → one continuous bar spanning all days
    // Time-specific events spanning multiple days → separate bar per day
    if (item.isAllDay || totalSpan === 1) {
      const lane = placeSeg(startCol, endCol, laneMemory.get(item.id));
      laneMemory.set(item.id, lane);

      segments.push({
        item,
        startCol,
        span: totalSpan,
        lane,
        colorClass,
        continuesFromPrev: evStart < wkStart,
        continuesToNext: evEnd > wkEnd,
      });
    } else {
      // Time-specific multi-day event: create one segment per day
      for (let col = startCol; col <= endCol; col++) {
        const lane = placeSeg(col, col);
        segments.push({
          item,
          startCol: col,
          span: 1,
          lane,
          colorClass,
          continuesFromPrev: false,
          continuesToNext: false,
        });
      }
    }
  }

  return segments;
}

export function CalendarView({ items }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => toKstDate(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const colorMap = useMemo(() => {
    const m = new Map<string, string>();
    items.forEach((item) =>
      m.set(item.id, EVENT_COLORS[hashString(item.id) % EVENT_COLORS.length])
    );
    return m;
  }, [items]);

  const dotColorMap = useMemo(() => {
    const m = new Map<string, string>();
    items.forEach((item) =>
      m.set(item.id, DOT_COLORS[hashString(item.id) % DOT_COLORS.length])
    );
    return m;
  }, [items]);

  const weeks = useMemo(() => {
    const mStart = startOfMonth(currentMonth);
    const mEnd = endOfMonth(currentMonth);
    const cStart = startOfWeek(mStart, { weekStartsOn: 0 });
    const cEnd = endOfWeek(mEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let d = cStart;
    while (d <= cEnd) { days.push(d); d = addDays(d, 1); }

    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    return rows;
  }, [currentMonth]);

  const weekSegments = useMemo(() => {
    const mem = new Map<string, number>();
    return weeks.map((wk) => computeWeekSegments(wk, items, colorMap, mem));
  }, [weeks, items, colorMap]);

  const selectedDayItems = useMemo(() => {
    if (!selectedDay) return [];
    return items.filter((item) => {
      const s = dayStart(eventStart(item));
      const e = dayEnd(eventEnd(item));
      return s <= dayEnd(selectedDay) && e >= dayStart(selectedDay);
    });
  }, [selectedDay, items]);

  return (
    <div className="space-y-4">
      <div className="card-base overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-2 border-b border-church-border">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="focus-ring inline-flex items-center justify-center w-11 h-11 rounded-lg hover:bg-church-bg transition-colors cursor-pointer"
            aria-label="이전 달"
          >
            <svg className="w-5 h-5 text-church-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-baseline gap-2" aria-live="polite">
            <h2 className="font-heading text-xl text-church-text leading-none">
              {format(currentMonth, "M월", { locale: ko })}
            </h2>
            <span className="label-mono">{format(currentMonth, "yyyy")}</span>
          </div>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="focus-ring inline-flex items-center justify-center w-11 h-11 rounded-lg hover:bg-church-bg transition-colors cursor-pointer"
            aria-label="다음 달"
          >
            <svg className="w-5 h-5 text-church-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 border-b border-church-border">
          {WEEKDAYS.map((wd, i) => (
            <div
              key={wd}
              className={`text-center text-[12px] font-semibold py-2 ${
                i === 0 ? "text-church-sunday" : i === 6 ? "text-church-saturday" : "text-church-muted"
              }`}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => {
          const segs = weekSegments[wi];
          const maxLane = segs.length > 0 ? Math.max(...segs.map((s) => s.lane)) : -1;
          const visibleLanes = Math.min(maxLane + 1, MAX_VISIBLE_LANES);
          const hasOverflow = maxLane + 1 > MAX_VISIBLE_LANES;

          // Always reserve space for MAX_VISIBLE_LANES so row height stays constant
          const BAR_H = 18;
          const BAR_GAP = 1; // space-y-px
          const reservedEventH = MAX_VISIBLE_LANES * BAR_H + (MAX_VISIBLE_LANES - 1) * BAR_GAP;

          return (
            <div key={wi} className="border-b border-church-border last:border-b-0">
              {/* Date number row */}
              <div className="grid grid-cols-7">
                {week.map((day) => {
                  const isCur = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, toKstDate(new Date()));
                  const isSel = selectedDay && isSameDay(day, selectedDay);
                  const dow = day.getDay();

                  return (
                    <button
                      key={format(day, "yyyy-MM-dd")}
                      onClick={() => setSelectedDay(isSel ? null : day)}
                      aria-label={format(day, "yyyy년 M월 d일 (EEEE)", { locale: ko })}
                      aria-pressed={!!isSel}
                      className={`focus-ring min-h-[44px] pt-1.5 pb-0.5 px-1 text-center transition-colors cursor-pointer ${
                        isSel ? "bg-church-navy/10" : "hover:bg-church-bg/60"
                      } ${!isCur ? "opacity-35" : ""}`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 text-[13px] rounded-full transition-colors ${
                          isToday
                            ? "bg-church-accent text-white font-semibold"
                            : dow === 0
                            ? "text-church-sunday font-medium"
                            : dow === 6
                            ? "text-church-saturday font-medium"
                            : "text-church-text"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile: dot indicators (compact, no text) */}
              <div className="sm:hidden grid grid-cols-7 pb-1.5 px-0.5">
                {week.map((day, ci) => {
                  const ds = dayStart(day);
                  const de = dayEnd(day);
                  const dayEvents = items.filter((item) => {
                    const s = dayStart(eventStart(item));
                    const e = dayEnd(eventEnd(item));
                    return s <= de && e >= ds;
                  });
                  const visible = dayEvents.slice(0, MAX_MOBILE_DOTS);
                  const extra = dayEvents.length - visible.length;

                  return (
                    <div
                      key={ci}
                      className="flex items-center justify-center gap-[3px] h-3"
                      aria-hidden="true"
                    >
                      {visible.map((ev) => (
                        <span
                          key={ev.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            dotColorMap.get(ev.id) ?? "bg-church-muted"
                          }`}
                        />
                      ))}
                      {extra > 0 && (
                        <span className="text-[9px] font-medium text-church-muted leading-none">
                          +{extra}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop: full event bars (≥ sm) */}
              <div
                className="hidden sm:block px-0.5 pb-1 space-y-px"
                style={{ minHeight: reservedEventH + 4 }}
              >
                {Array.from({ length: visibleLanes }).map((_, laneIdx) => {
                  const laneSegs = segs.filter((s) => s.lane === laneIdx);

                  return (
                    <div key={laneIdx} className="grid grid-cols-7 gap-x-0.5" style={{ height: BAR_H }}>
                      {laneSegs.map((seg) => (
                        <Link
                          key={seg.item.id + "-" + seg.startCol}
                          href={`/announcements/${seg.item.id}`}
                          className={`${seg.colorClass} text-[11px] font-medium truncate px-1.5 flex items-center transition-opacity hover:opacity-85 ${
                            seg.continuesFromPrev ? "rounded-l-none" : "rounded-l"
                          } ${seg.continuesToNext ? "rounded-r-none" : "rounded-r"}`}
                          style={{
                            gridColumn: `${seg.startCol + 1} / span ${seg.span}`,
                            height: BAR_H,
                          }}
                          title={seg.item.title}
                        >
                          {seg.item.title}
                        </Link>
                      ))}
                    </div>
                  );
                })}

                {/* Overflow "+N" per day */}
                {hasOverflow && (
                  <div className="grid grid-cols-7 gap-x-0.5" style={{ height: 16 }}>
                    {week.map((day, ci) => {
                      const hidden = segs.filter(
                        (s) =>
                          s.lane >= MAX_VISIBLE_LANES &&
                          ci >= s.startCol &&
                          ci < s.startCol + s.span
                      ).length;
                      if (hidden === 0) return <div key={ci} />;
                      return (
                        <button
                          key={ci}
                          onClick={() => setSelectedDay(day)}
                          className="focus-ring text-[11px] text-church-muted font-medium text-left px-1 hover:text-church-accent truncate cursor-pointer"
                          style={{ gridColumn: `${ci + 1}` }}
                          aria-label={`이 날에 ${hidden}개 공지 더 보기`}
                        >
                          +{hidden}개
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day detail: timeline */}
      {selectedDay && (
        <div className="card-base overflow-hidden">
          <div className="px-4 py-3 border-b border-church-border bg-church-bg/50">
            <h3 className="font-heading text-base text-church-navy">
              {format(selectedDay, "M월 d일 (EEEE)", { locale: ko })}
            </h3>
            <p className="text-xs text-church-muted mt-0.5">
              {selectedDayItems.length > 0
                ? `${selectedDayItems.length}개의 공지`
                : "공지사항 없음"}
            </p>
          </div>

          {selectedDayItems.length > 0 ? (
            <DayTimeline items={selectedDayItems} day={selectedDay} colorMap={colorMap} />
          ) : (
            <div className="py-10 text-center text-sm text-church-muted">
              이 날에는 공지사항이 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Day Timeline                                                       */
/* ------------------------------------------------------------------ */

interface DayTimelineProps {
  items: Announcement[];
  day: Date;
  colorMap: Map<string, string>;
}

const HOUR_PX = 48;

function DayTimeline({ items, day, colorMap }: DayTimelineProps) {
  const range = useMemo(() => {
    let lo = 24, hi = 0;
    for (const item of items) {
      const s = eventStart(item);
      const e = eventEnd(item);
      const ds = dayStart(day), de = dayEnd(day);
      const es = s < ds ? ds : s;
      const ee = e > de ? de : e;
      lo = Math.min(lo, es.getHours());
      hi = Math.max(hi, ee.getHours() + 1);
    }
    lo = Math.max(0, lo - 1);
    hi = Math.min(24, hi + 1);
    if (hi - lo < 4) {
      const c = Math.floor((lo + hi) / 2);
      lo = Math.max(0, c - 2);
      hi = Math.min(24, c + 2);
    }
    return { lo, hi };
  }, [items, day]);

  const hours = range.hi - range.lo;
  const h = hours * HOUR_PX;

  const bars = useMemo(() => {
    return items.map((item) => {
      const s = eventStart(item);
      const e = item.eventEndAt ? eventEnd(item) : new Date(s.getTime() + 3600000);
      const ds = dayStart(day), de = dayEnd(day);
      const es = s < ds ? ds : s;
      const ee = e > de ? de : e;

      const sMin = es.getHours() * 60 + es.getMinutes() - range.lo * 60;
      const eMin = ee.getHours() * 60 + ee.getMinutes() - range.lo * 60;
      const dur = Math.max(eMin - sMin, 30);

      return {
        item,
        top: Math.max(0, (sMin / (hours * 60)) * h),
        height: Math.max(24, (dur / (hours * 60)) * h),
        colorClass: colorMap.get(item.id) ?? EVENT_COLORS[0],
        startTime: format(es, "HH:mm"),
        endTime: format(ee, "HH:mm"),
      };
    });
  }, [items, day, range, hours, h, colorMap]);

  return (
    <div className="relative overflow-y-auto" style={{ height: Math.min(h + 16, 320) }}>
      <div className="relative" style={{ height: h }}>
        {Array.from({ length: hours + 1 }).map((_, i) => {
          const hour = range.lo + i;
          const top = (i / hours) * h;
          return (
            <div key={hour} className="absolute left-0 right-0" style={{ top }}>
              <div className="flex items-start">
                <span className="text-[10px] text-church-muted w-10 shrink-0 text-right pr-2 -translate-y-1.5">
                  {hour.toString().padStart(2, "0")}:00
                </span>
                <div className="flex-1 border-t border-church-border/50" />
              </div>
            </div>
          );
        })}

        {bars.map(({ item, top, height, colorClass, startTime, endTime }) => (
          <Link
            key={item.id}
            href={`/announcements/${item.id}`}
            className={`focus-ring absolute left-12 right-3 rounded-md ${colorClass} px-2.5 py-1 overflow-hidden transition-opacity hover:opacity-90`}
            style={{ top, height, minHeight: 24 }}
            aria-label={`${item.title} 자세히 보기`}
          >
            <p className="text-xs font-semibold truncate leading-tight">{item.title}</p>
            {height >= 36 && (
              <p className="text-[10px] opacity-80 mt-0.5">
                {startTime} - {endTime}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
