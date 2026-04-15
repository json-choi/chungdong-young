"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TiptapEditor } from "./tiptap-editor";
import { ImageUploader } from "./image-uploader";
import { toast } from "sonner";
import type { Announcement } from "@/server/db/schema";

interface AnnouncementFormProps {
  announcement?: Announcement;
}

function formatDateForInput(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().slice(0, 16);
}

export function AnnouncementForm({ announcement }: AnnouncementFormProps) {
  const router = useRouter();
  const isEditing = !!announcement;

  const [title, setTitle] = useState(announcement?.title ?? "");
  const [bodyHtml, setBodyHtml] = useState(announcement?.bodyHtml ?? "");
  const [linkUrl, setLinkUrl] = useState(announcement?.linkUrl ?? "");
  const [priority, setPriority] = useState(announcement?.priority ?? 0);

  const [showOnFeed, setShowOnFeed] = useState(announcement?.showOnFeed ?? true);
  const [showOnCalendar, setShowOnCalendar] = useState(
    announcement?.showOnCalendar ?? false
  );

  const [startAt, setStartAt] = useState(
    formatDateForInput(announcement?.startAt ?? new Date())
  );
  const [endAt, setEndAt] = useState(
    formatDateForInput(announcement?.endAt ?? null)
  );

  const [isAllDay, setIsAllDay] = useState(announcement?.isAllDay ?? false);
  const [eventStartAt, setEventStartAt] = useState(
    formatDateForInput(announcement?.eventStartAt ?? null)
  );
  const [eventEndAt, setEventEndAt] = useState(
    formatDateForInput(announcement?.eventEndAt ?? null)
  );

  const [isPublished, setIsPublished] = useState(
    announcement?.isPublished ?? false
  );
  const [imageUrl, setImageUrl] = useState(announcement?.imageUrl ?? "");
  const [imageBlobPath, setImageBlobPath] = useState(
    announcement?.imageBlobPath ?? ""
  );
  const [saving, setSaving] = useState(false);

  const neitherSelected = !showOnFeed && !showOnCalendar;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (neitherSelected) {
      toast.error("피드 또는 달력 중 하나는 선택해주세요");
      return;
    }
    setSaving(true);

    try {
      const effectiveStartAt = showOnFeed ? startAt : eventStartAt || startAt;

      const payload = {
        title,
        bodyHtml,
        linkUrl,
        priority,
        showOnFeed,
        showOnCalendar,
        startAt: effectiveStartAt,
        endAt: showOnFeed ? endAt : "",
        isAllDay: showOnCalendar ? isAllDay : false,
        eventStartAt: showOnCalendar ? eventStartAt : "",
        eventEndAt: showOnCalendar ? eventEndAt : "",
        isPublished,
        imageUrl,
        imageBlobPath,
      };

      const url = isEditing
        ? `/api/admin/announcements/${announcement.id}`
        : "/api/admin/announcements";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success(isEditing ? "수정되었습니다" : "작성되었습니다");
      router.push("/admin/announcements");
      router.refresh();
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pb-24">
      {/* Header */}
      <header className="mb-6 pb-5 border-b border-church-border-soft">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <Link
              href="/admin/announcements"
              className="focus-ring inline-flex items-center gap-1 text-[12.5px] text-church-muted hover:text-church-text rounded transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              공지사항 목록
            </Link>
            <div className="mt-1.5 flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-[24px] sm:text-[26px] text-church-text leading-tight">
                {isEditing ? "공지 수정" : "새 공지 작성"}
              </h1>
              {isEditing ? (
                isPublished ? (
                  <span className="pill bg-emerald-50 text-emerald-700">
                    <span className="pill-dot" />
                    게시중
                  </span>
                ) : (
                  <span className="pill bg-church-border-soft text-church-muted">
                    <span className="pill-dot" />
                    초안
                  </span>
                )
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Main grid: content + side */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ─────────── Left: Main content ─────────── */}
        <div className="space-y-6 min-w-0">
          <section className="card-base p-6">
            <SectionTitle title="콘텐츠" description="공지의 제목과 본문을 작성합니다." />
            <div className="space-y-5 mt-5">
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>내용</Label>
                <TiptapEditor content={bodyHtml} onChange={setBodyHtml} />
              </div>
            </div>
          </section>

          <section className="card-base p-6">
            <SectionTitle title="미디어 및 링크" description="이미지와 외부 링크를 설정합니다. (선택)" />
            <div className="space-y-5 mt-5">
              <div className="space-y-2">
                <Label>이미지</Label>
                <ImageUploader
                  imageUrl={imageUrl}
                  onUpload={(url, path) => {
                    setImageUrl(url);
                    setImageBlobPath(path);
                  }}
                  onRemove={() => {
                    setImageUrl("");
                    setImageBlobPath("");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkUrl">외부 링크</Label>
                <Input
                  id="linkUrl"
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://"
                />
              </div>
            </div>
          </section>
        </div>

        {/* ─────────── Right: Sidebar settings ─────────── */}
        <aside className="space-y-6 lg:sticky lg:top-6 self-start">
          {/* Publish status */}
          <section className="card-base p-5">
            <SectionTitle title="게시" compact />
            <div className="mt-4 space-y-3">
              <ToggleRow
                id="isPublished"
                label="즉시 게시"
                description="체크 해제 시 초안으로 저장됩니다"
                checked={isPublished}
                onChange={setIsPublished}
              />
              <div className="space-y-2">
                <Label htmlFor="priority">우선순위</Label>
                <Input
                  id="priority"
                  type="number"
                  min={0}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="font-mono tabular-nums"
                />
                <p className="text-[12px] text-church-muted">
                  숫자가 높을수록 상위에 표시
                </p>
              </div>
            </div>
          </section>

          {/* Visibility */}
          <section className="card-base p-5">
            <SectionTitle title="표시 위치" compact />
            <div className="mt-4 space-y-3">
              <ToggleRow
                id="showOnFeed"
                label="피드"
                description="메인 공지사항 목록에 표시"
                checked={showOnFeed}
                onChange={setShowOnFeed}
              />
              <ToggleRow
                id="showOnCalendar"
                label="달력"
                description="캘린더 이벤트로 표시"
                checked={showOnCalendar}
                onChange={setShowOnCalendar}
              />
              {neitherSelected && (
                <p className="text-[12px] text-church-crimson">
                  하나 이상 선택해주세요
                </p>
              )}
            </div>
          </section>

          {/* Feed period */}
          {showOnFeed && (
            <section className="card-base p-5">
              <SectionTitle title="게시 기간" compact description="피드 표시 기간" />
              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startAt" className="text-[12.5px]">시작</Label>
                  <Input
                    id="startAt"
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    required={showOnFeed}
                    className="font-mono tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endAt" className="text-[12.5px]">종료 (선택)</Label>
                  <Input
                    id="endAt"
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="font-mono tabular-nums"
                  />
                  <p className="text-[11.5px] text-church-muted">
                    비워두면 수동으로 내릴 때까지 게시됩니다
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Calendar event */}
          {showOnCalendar && (
            <section className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5">
              <SectionTitle title="일정 시간" compact description="달력 이벤트 일시" tone="teal" />
              <div className="mt-4 space-y-3">
                <ToggleRow
                  id="isAllDay"
                  label="종일 일정"
                  description="여러 날 이어지는 일정 (수련회 등)"
                  checked={isAllDay}
                  onChange={setIsAllDay}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="eventStartAt" className="text-[12.5px]">
                    {isAllDay ? "시작일" : "시작 일시"}
                  </Label>
                  <Input
                    id="eventStartAt"
                    type={isAllDay ? "date" : "datetime-local"}
                    value={isAllDay ? eventStartAt.slice(0, 10) : eventStartAt}
                    onChange={(e) => setEventStartAt(e.target.value)}
                    required={showOnCalendar}
                    className="font-mono tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="eventEndAt" className="text-[12.5px]">
                    {isAllDay ? "종료일" : "종료 일시"}
                  </Label>
                  <Input
                    id="eventEndAt"
                    type={isAllDay ? "date" : "datetime-local"}
                    value={isAllDay ? eventEndAt.slice(0, 10) : eventEndAt}
                    onChange={(e) => setEventEndAt(e.target.value)}
                    className="font-mono tabular-nums"
                  />
                  <p className="text-[11.5px] text-church-muted">
                    {isAllDay ? "비워두면 하루 일정" : "비워두면 1시간 일정"}
                  </p>
                </div>
              </div>
            </section>
          )}
        </aside>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 inset-x-0 lg:left-64 z-20 border-t border-church-border bg-white/85 backdrop-blur">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-church-muted hidden sm:block">
            {isEditing ? "변경사항은 저장을 눌러야 반영됩니다" : "새 공지를 작성 중입니다"}
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="cursor-pointer"
              disabled={saving}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="bg-church-text hover:bg-church-navy-light text-white cursor-pointer min-w-24"
              disabled={saving || neitherSelected}
            >
              {saving ? "저장 중..." : isEditing ? "수정 저장" : "작성"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function SectionTitle({
  title,
  description,
  compact,
  tone,
}: {
  title: string;
  description?: string;
  compact?: boolean;
  tone?: "teal";
}) {
  const titleColor = tone === "teal" ? "text-teal-800" : "text-church-text";
  return (
    <div>
      <h2
        className={`font-heading ${compact ? "text-[14px]" : "text-[16px]"} ${titleColor}`}
      >
        {title}
      </h2>
      {description ? (
        <p className="text-[12.5px] text-church-muted mt-1 leading-relaxed">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 py-1.5 cursor-pointer group"
    >
      <span className="relative inline-flex mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="w-9 h-5 rounded-full bg-church-border transition-colors peer-checked:bg-church-accent peer-focus-visible:ring-2 peer-focus-visible:ring-church-navy peer-focus-visible:ring-offset-2"
        />
        <span
          aria-hidden="true"
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium text-church-text">
          {label}
        </span>
        {description ? (
          <span className="block text-[12px] text-church-muted leading-relaxed mt-0.5">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
