"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ImageUploaderProps {
  imageUrl: string;
  onUpload: (url: string, pathname: string) => void;
  onRemove: () => void;
}

export function ImageUploader({
  imageUrl,
  onUpload,
  onRemove,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/blob/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onUpload(data.url, data.pathname);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드에 실패했습니다");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-3">
      {imageUrl ? (
        <div className="relative">
          <div className="relative w-full aspect-video rounded-md overflow-hidden bg-gray-100">
            <Image
              src={imageUrl}
              alt="첨부 이미지"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="mt-2"
            onClick={onRemove}
          >
            이미지 삭제
          </Button>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "업로드 중..." : "이미지 첨부"}
          </Button>
          <p className="text-xs text-church-muted mt-1">
            JPEG, PNG, WebP, GIF (최대 5MB)
          </p>
        </div>
      )}
      {error && <p className="text-sm text-church-crimson">{error}</p>}
    </div>
  );
}
