"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Visibility
  const [showOnFeed, setShowOnFeed] = useState(announcement?.showOnFeed ?? true);
  const [showOnCalendar, setShowOnCalendar] = useState(
    announcement?.showOnCalendar ?? false
  );

  // Publication period (for feed)
  const [startAt, setStartAt] = useState(
    formatDateForInput(announcement?.startAt ?? new Date())
  );
  const [endAt, setEndAt] = useState(
    formatDateForInput(announcement?.endAt ?? null)
  );

  // Calendar event fields
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
      // For calendar-only (no feed), use eventStartAt as startAt
      const effectiveStartAt = showOnFeed
        ? startAt
        : eventStartAt || startAt;

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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base text-church-text">
            {isEditing ? "수정" : "새 글 작성"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Title */}
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

          {/* Content */}
          <div className="space-y-2">
            <Label>내용</Label>
            <TiptapEditor content={bodyHtml} onChange={setBodyHtml} />
          </div>

          {/* Image */}
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

          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="linkUrl">외부 링크 (선택)</Label>
            <Input
              id="linkUrl"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
            />
          </div>

          {/* ── Visibility toggles ── */}
          <div className="space-y-3 rounded-lg border border-church-border p-4">
            <p className="text-sm font-medium text-church-text">표시 위치</p>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnFeed}
                  onChange={(e) => setShowOnFeed(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">피드</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnCalendar}
                  onChange={(e) => setShowOnCalendar(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">달력</span>
              </label>
            </div>
            {neitherSelected && (
              <p className="text-xs text-church-crimson">
                하나 이상 선택해주세요
              </p>
            )}
          </div>

          {/* ── Feed: publication period ── */}
          {showOnFeed && (
            <div className="space-y-4 rounded-lg border border-church-border bg-church-bg/30 p-4">
              <p className="text-sm font-medium text-church-text">게시 기간</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startAt">시작</Label>
                  <Input
                    id="startAt"
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    required={showOnFeed}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endAt">종료 (선택)</Label>
                  <Input
                    id="endAt"
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                  />
                  <p className="text-xs text-church-muted">
                    비워두면 수동으로 내릴 때까지
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Calendar: event schedule ── */}
          {showOnCalendar && (
            <div className="space-y-4 rounded-lg border border-teal-200 bg-teal-50/30 p-4">
              <p className="text-sm font-medium text-teal-800">일정 시간</p>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">종일 일정</span>
                <span className="text-xs text-church-muted">
                  (수련회 등 여러 날 이어지는 일정)
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventStartAt">
                    {isAllDay ? "시작일" : "시작 일시"}
                  </Label>
                  <Input
                    id="eventStartAt"
                    type={isAllDay ? "date" : "datetime-local"}
                    value={isAllDay ? eventStartAt.slice(0, 10) : eventStartAt}
                    onChange={(e) => setEventStartAt(e.target.value)}
                    required={showOnCalendar}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventEndAt">
                    {isAllDay ? "종료일" : "종료 일시"}
                  </Label>
                  <Input
                    id="eventEndAt"
                    type={isAllDay ? "date" : "datetime-local"}
                    value={isAllDay ? eventEndAt.slice(0, 10) : eventEndAt}
                    onChange={(e) => setEventEndAt(e.target.value)}
                  />
                  <p className="text-xs text-church-muted">
                    {isAllDay
                      ? "비워두면 하루 일정"
                      : "비워두면 1시간 일정"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">우선순위</Label>
            <Input
              id="priority"
              type="number"
              min={0}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            />
            <p className="text-xs text-church-muted">
              숫자가 높을수록 상위에 표시
            </p>
          </div>

          {/* Publish */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">즉시 게시</span>
          </label>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="submit"
          className="bg-church-text hover:bg-church-navy-light text-white cursor-pointer"
          disabled={saving || neitherSelected}
        >
          {saving ? "저장 중..." : isEditing ? "수정" : "작성"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          취소
        </Button>
      </div>
    </form>
  );
}
