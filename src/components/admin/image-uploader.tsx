"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { compressImage } from "@/lib/image-compress";
import { adminFetch, AdminFetchError } from "@/lib/admin-fetch";
import { toast } from "sonner";

export interface GalleryImage {
  url: string;
  path: string;
  /** Per-image CSS object-position ("xx% yy%") for cover-mode cropping */
  focal: string;
}

type UploadState =
  | { phase: "compressing" | "uploading"; progress?: number }
  | { phase: "done"; image: GalleryImage }
  | { phase: "error"; message: string };

interface PendingItem {
  id: string; // temp id for React keys
  file: File;
  previewUrl: string; // blob: URL
  state: UploadState;
}

interface ImageUploaderProps {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  maxImages?: number;
  maxRawBytes?: number;
}

const DEFAULT_MAX = 10;
const DEFAULT_MAX_RAW = 15 * 1024 * 1024;

export function ImageUploader({
  images,
  onChange,
  maxImages = DEFAULT_MAX,
  maxRawBytes = DEFAULT_MAX_RAW,
}: ImageUploaderProps) {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const remainingSlots = Math.max(0, maxImages - images.length - pending.length);
  const uploading = pending.some(
    (p) => p.state.phase === "compressing" || p.state.phase === "uploading"
  );

  const uploadOne = useCallback(
    async (item: PendingItem): Promise<PendingItem> => {
      try {
        setPending((curr) =>
          curr.map((p) =>
            p.id === item.id ? { ...p, state: { phase: "compressing" } } : p
          )
        );

        const compressed = await compressImage(item.file, {
          maxDimension: 2000,
          quality: 0.85,
        });

        setPending((curr) =>
          curr.map((p) =>
            p.id === item.id ? { ...p, state: { phase: "uploading" } } : p
          )
        );

        const formData = new FormData();
        formData.append("file", compressed);

        const res = await adminFetch("/api/admin/blob/upload", {
          method: "POST",
          body: formData,
        });

        const data = (await res.json()) as { url: string; pathname: string };
        return {
          ...item,
          state: {
            phase: "done",
            image: { url: data.url, path: data.pathname, focal: "50% 50%" },
          },
        };
      } catch (err) {
        const parts: string[] = [];
        if (err instanceof AdminFetchError) {
          parts.push(err.message);
          if (err.detail) parts.push(err.detail);
          if (err.hint) parts.push(err.hint);
          if (err.errorId) parts.push(`오류 번호: ${err.errorId}`);
        } else if (err instanceof Error) {
          parts.push(err.message);
        } else {
          parts.push("업로드 실패");
        }
        return {
          ...item,
          state: {
            phase: "error",
            message: parts.join(" · "),
          },
        };
      }
    },
    []
  );

  const ingestFiles = useCallback(
    async (fileList: FileList | File[] | null) => {
      if (!fileList) return;
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const acceptable = files.filter((f) => f.type.startsWith("image/"));
      if (acceptable.length === 0) {
        toast.error("이미지 파일만 업로드할 수 있습니다");
        return;
      }
      if (acceptable.length < files.length) {
        toast.warning(`${files.length - acceptable.length}개의 비이미지 파일은 제외됐어요`);
      }

      const trimmed = acceptable.slice(0, remainingSlots);
      if (trimmed.length < acceptable.length) {
        toast.warning(
          `이미지는 최대 ${maxImages}장까지 업로드할 수 있어요 (남은 ${remainingSlots}장)`
        );
      }
      if (trimmed.length === 0) return;

      const rawOk = trimmed.filter((f) => f.size <= maxRawBytes);
      if (rawOk.length < trimmed.length) {
        toast.error(
          `장당 ${Math.round(maxRawBytes / 1024 / 1024)}MB 이하여야 합니다 (${
            trimmed.length - rawOk.length
          }장 제외)`
        );
      }

      const items: PendingItem[] = rawOk.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        state: { phase: "compressing" },
      }));

      setPending((curr) => [...curr, ...items]);

      // Upload sequentially to avoid thrashing Blob API and to keep progress ordered
      for (const item of items) {
        const updated = await uploadOne(item);
        setPending((curr) => curr.map((p) => (p.id === item.id ? updated : p)));
      }
    },
    [remainingSlots, maxImages, maxRawBytes, uploadOne]
  );

  // Flush completed items into the parent state — in batch, preserving order
  useEffect(() => {
    const successes = pending.filter(
      (p): p is PendingItem & { state: { phase: "done"; image: GalleryImage } } =>
        p.state.phase === "done"
    );
    if (successes.length === 0) return;

    // Revoke blob URLs we no longer need
    successes.forEach((s) => URL.revokeObjectURL(s.previewUrl));

    onChange([...images, ...successes.map((s) => s.state.image)]);
    setPending((curr) => curr.filter((p) => p.state.phase !== "done"));
    // Intentionally omit `images` + `onChange` from deps to avoid feedback loop;
    // we only want to run when pending queue changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Paste from clipboard — listen only when drop zone is focused/hovered
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (!e.clipboardData) return;
      const files = Array.from(e.clipboardData.files);
      if (files.length === 0) return;
      e.preventDefault();
      ingestFiles(files);
    }
    const zone = dropZoneRef.current;
    zone?.addEventListener("paste", onPaste);
    return () => zone?.removeEventListener("paste", onPaste);
  }, [ingestFiles]);

  function handleRemove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function handleRetry(id: string) {
    const item = pending.find((p) => p.id === id);
    if (!item) return;
    (async () => {
      const updated = await uploadOne(item);
      setPending((curr) => curr.map((p) => (p.id === id ? updated : p)));
    })();
  }

  function handleDismissError(id: string) {
    setPending((curr) => {
      const target = curr.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return curr.filter((p) => p.id !== id);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.url === active.id);
    const newIndex = images.findIndex((img) => img.url === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onChange(arrayMove(images, oldIndex, newIndex));
  }

  const hasAny = images.length > 0 || pending.length > 0;
  const acceptSlots = remainingSlots > 0;

  return (
    <div className="space-y-3">
      {/* Thumbnail grid */}
      {hasAny && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((img) => img.url)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <SortableThumb
                  key={img.url}
                  image={img}
                  index={idx}
                  onRemove={() => handleRemove(idx)}
                />
              ))}
              {pending.map((p) => (
                <PendingThumb
                  key={p.id}
                  item={p}
                  onRetry={() => handleRetry(p.id)}
                  onDismiss={() => handleDismissError(p.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Drop zone */}
      {acceptSlots && (
        <div
          ref={dropZoneRef}
          tabIndex={0}
          role="button"
          aria-label="이미지 업로드"
          aria-disabled={uploading}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            ingestFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`focus-ring relative flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
            dragOver
              ? "border-church-accent bg-church-accent-soft"
              : "border-church-border hover:border-church-muted/50 hover:bg-church-border-soft/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => ingestFiles(e.target.files)}
            className="sr-only"
          />
          <svg
            className={`w-8 h-8 ${
              dragOver ? "text-church-accent" : "text-church-muted"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="text-center">
            <p className="text-[13.5px] font-medium text-church-text">
              {dragOver
                ? "여기에 놓으세요"
                : `이미지 끌어다 놓기 · 클릭 · 붙여넣기 (Cmd+V)`}
            </p>
            <p className="text-[11.5px] text-church-muted mt-0.5">
              최대 {maxImages}장 · 장당 {Math.round(maxRawBytes / 1024 / 1024)}MB · 업로드 시 자동 WebP 변환
              {images.length > 0 && pending.length === 0 && ` · 남은 ${remainingSlots}장`}
            </p>
          </div>
        </div>
      )}

      {!acceptSlots && !uploading && (
        <p className="text-[12px] text-church-muted text-center py-2">
          최대 {maxImages}장까지 업로드했습니다. 삭제하면 추가할 수 있어요.
        </p>
      )}
    </div>
  );
}

function SortableThumb({
  image,
  index,
  onRemove,
}: {
  image: GalleryImage;
  index: number;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square rounded-lg overflow-hidden bg-church-border-soft border border-church-border"
    >
      {index === 0 && (
        <span
          className="absolute top-1.5 left-1.5 z-2 pill bg-church-text text-church-surface"
          title="대표 이미지 (목록 썸네일)"
        >
          대표
        </span>
      )}

      <button
        type="button"
        aria-label={`이미지 ${index + 1} 순서 변경 (드래그)`}
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing focus-ring"
      >
        <span className="sr-only">드래그로 순서 변경</span>
      </button>

      <Image
        src={image.url}
        alt=""
        fill
        sizes="(max-width: 640px) 33vw, 160px"
        className="object-cover pointer-events-none"
      />

      <button
        type="button"
        onClick={onRemove}
        aria-label={`이미지 ${index + 1} 삭제`}
        className="absolute top-1.5 right-1.5 z-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer focus-ring"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <span className="absolute bottom-1.5 right-1.5 z-2 pill bg-black/60 text-white font-mono tabular-nums">
        {index + 1}
      </span>
    </div>
  );
}

function PendingThumb({
  item,
  onRetry,
  onDismiss,
}: {
  item: PendingItem;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const { state, previewUrl } = item;
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-church-border-soft border border-church-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {state.phase !== "done" && (
        <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-1.5 text-white">
          {state.phase === "error" ? (
            <>
              <svg className="w-5 h-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-[11px] px-2 text-center leading-tight">
                {state.message}
              </p>
              <div className="flex gap-1 mt-1">
                <button
                  type="button"
                  onClick={onRetry}
                  className="focus-ring px-2 py-0.5 rounded text-[10.5px] font-medium bg-white text-church-text hover:bg-white/90 cursor-pointer"
                >
                  재시도
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="focus-ring px-2 py-0.5 rounded text-[10.5px] font-medium bg-white/20 hover:bg-white/30 cursor-pointer"
                >
                  취소
                </button>
              </div>
            </>
          ) : (
            <>
              <svg
                className="w-6 h-6 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p className="text-[10.5px] font-medium">
                {state.phase === "compressing" ? "압축 중" : "업로드 중"}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
