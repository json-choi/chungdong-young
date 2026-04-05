"use client";

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
import type { Announcement } from "@/server/db/schema";

interface CalendarViewProps {
  items: Announcement[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MAX_VISIBLE_LANES = 3;

const EVENT_COLORS = [
  "bg-church-navy text-white",
  "bg-teal-600 text-white",
  "bg-church-crimson text-white",
  "bg-amber-500 text-white",
  "bg-purple-600 text-white",
  "bg-emerald-600 text-white",
];

interface EventSegment {
  item: Announcement;
  startCol: number; // 0-based column in the week (0=Sun)
  span: number; // how many columns
  lane: number; // which row in the event area
  colorClass: string;
  continuesFromPrev: boolean;
  continuesToNext: boolean;
}

function dayStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayEnd(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** Get the effective event start/end for calendar display */
function eventStart(item: Announcement): Date {
  return new Date(item.eventStartAt ?? item.startAt);
}
function eventEnd(item: Announcement): Date {
  return item.eventEndAt ? new Date(item.eventEndAt) : new Date(item.eventStartAt ?? item.startAt);
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
      // eslint-disable-next-line no-constant-condition
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const colorMap = useMemo(() => {
    const m = new Map<string, string>();
    items.forEach((item, i) => m.set(item.id, EVENT_COLORS[i % EVENT_COLORS.length]));
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-church-border">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-church-bg transition-colors"
            aria-label="이전 달"
          >
            <svg className="w-5 h-5 text-church-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-base font-semibold text-church-text">
            {format(currentMonth, "yyyy년 M월", { locale: ko })}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-church-bg transition-colors"
            aria-label="다음 달"
          >
            <svg className="w-5 h-5 text-church-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 border-b border-church-border">
          {WEEKDAYS.map((wd, i) => (
            <div
              key={wd}
              className={`text-center text-[11px] font-medium py-2 ${
                i === 0 ? "text-church-crimson" : i === 6 ? "text-blue-500" : "text-church-muted"
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
                  const isToday = isSameDay(day, new Date());
                  const isSel = selectedDay && isSameDay(day, selectedDay);
                  const dow = day.getDay();

                  return (
                    <button
                      key={format(day, "yyyy-MM-dd")}
                      onClick={() => setSelectedDay(isSel ? null : day)}
                      className={`pt-1 pb-0.5 px-1 text-center transition-colors ${
                        isSel ? "bg-church-navy/5" : "hover:bg-church-bg/50"
                      } ${!isCur ? "opacity-25" : ""}`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 text-[11px] rounded-full ${
                          isToday
                            ? "bg-church-navy text-white font-bold"
                            : dow === 0
                            ? "text-church-crimson"
                            : dow === 6
                            ? "text-blue-500"
                            : "text-church-text"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Event area — fixed height regardless of content */}
              <div
                className="px-0.5 pb-1 space-y-px"
                style={{ minHeight: reservedEventH + 4 }}
              >
                {Array.from({ length: visibleLanes }).map((_, laneIdx) => {
                  const laneSegs = segs.filter((s) => s.lane === laneIdx);

                  return (
                    <div key={laneIdx} className="grid grid-cols-7 gap-x-0.5" style={{ height: BAR_H }}>
                      {laneSegs.map((seg) => (
                        <div
                          key={seg.item.id}
                          className={`${seg.colorClass} text-[9px] font-medium truncate px-1.5 flex items-center ${
                            seg.continuesFromPrev ? "rounded-l-none" : "rounded-l"
                          } ${seg.continuesToNext ? "rounded-r-none" : "rounded-r"}`}
                          style={{
                            gridColumn: `${seg.startCol + 1} / span ${seg.span}`,
                            height: BAR_H,
                          }}
                          title={seg.item.title}
                        >
                          {seg.item.title}
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* Overflow "+N" per day */}
                {hasOverflow && (
                  <div className="grid grid-cols-7 gap-x-0.5" style={{ height: 14 }}>
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
                          className="text-[9px] text-church-muted font-medium text-left px-1 hover:text-church-navy truncate"
                          style={{ gridColumn: `${ci + 1}` }}
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
            <h3 className="text-sm font-semibold text-church-text">
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
          <div
            key={item.id}
            className={`absolute left-12 right-3 rounded-md ${colorClass} px-2.5 py-1 overflow-hidden`}
            style={{ top, height, minHeight: 24 }}
          >
            <p className="text-xs font-semibold truncate leading-tight">{item.title}</p>
            {height >= 36 && (
              <p className="text-[10px] opacity-80 mt-0.5">
                {startTime} - {endTime}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
