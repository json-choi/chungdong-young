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
  const [startAt, setStartAt] = useState(
    formatDateForInput(announcement?.startAt ?? new Date())
  );
  const [endAt, setEndAt] = useState(
    formatDateForInput(announcement?.endAt ?? null)
  );
  const [isPublished, setIsPublished] = useState(
    announcement?.isPublished ?? false
  );
  const [imageUrl, setImageUrl] = useState(announcement?.imageUrl ?? "");
  const [imageBlobPath, setImageBlobPath] = useState(
    announcement?.imageBlobPath ?? ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title,
        bodyHtml,
        linkUrl,
        priority,
        startAt,
        endAt,
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

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      toast.success(isEditing ? "공지가 수정되었습니다" : "공지가 작성되었습니다");
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
          <CardTitle className="text-lg text-church-navy">
            {isEditing ? "공지 수정" : "새 공지 작성"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="공지 제목을 입력하세요"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>내용</Label>
            <TiptapEditor content={bodyHtml} onChange={setBodyHtml} />
          </div>

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
            <Label htmlFor="linkUrl">외부 링크 (선택)</Label>
            <Input
              id="linkUrl"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startAt">시작일시</Label>
              <Input
                id="startAt"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endAt">종료일시 (선택)</Label>
              <Input
                id="endAt"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
          </div>

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
              숫자가 높을수록 상위에 표시됩니다
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="isPublished"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isPublished" className="cursor-pointer">
              즉시 게시
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="submit"
          className="bg-church-navy hover:bg-church-navy/90"
          disabled={saving}
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
