"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  IMAGE_ASPECTS,
  type ImageAspect,
  type ImageFit,
} from "@/server/validation/announcement";
import type { GalleryImage } from "./image-uploader";

interface ImageDisplaySettingsProps {
  images: GalleryImage[];
  activeIndex: number;
  onActiveIndexChange: (idx: number) => void;
  aspect: ImageAspect;
  fit: ImageFit;
  onAspectChange: (a: ImageAspect) => void;
  onFitChange: (f: ImageFit) => void;
  /** Update focal for the currently active image */
  onFocalChange: (focal: string) => void;
}

const ASPECT_RATIO: Record<ImageAspect, number | null> = {
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
  "3:4": 3 / 4,
  original: null,
};

const MINI_TILE: Record<ImageAspect, { w: number; h: number }> = {
  "16:9": { w: 32, h: 18 },
  "4:3": { w: 28, h: 21 },
  "1:1": { w: 22, h: 22 },
  "3:4": { w: 18, h: 24 },
  original: { w: 26, h: 20 },
};

const MAX_PREVIEW_HEIGHT = 360;
const MAX_PREVIEW_WIDTH = 600;

function parseFocal(focal: string): { x: number; y: number } {
  const match = /^(\d{1,3})% (\d{1,3})%$/.exec(focal);
  if (!match) return { x: 50, y: 50 };
  return {
    x: Math.min(100, Math.max(0, Number(match[1]))),
    y: Math.min(100, Math.max(0, Number(match[2]))),
  };
}

export function ImageDisplaySettings({
  images,
  activeIndex,
  onActiveIndexChange,
  aspect,
  fit,
  onAspectChange,
  onFitChange,
  onFocalChange,
}: ImageDisplaySettingsProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const active = images[activeIndex] ?? images[0];
  const focal = active?.focal ?? "50% 50%";

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [drag, setDrag] = useState<{
    startX: number;
    startY: number;
    startFocalX: number;
    startFocalY: number;
  } | null>(null);

  // Reset natural size when switching image
  useEffect(() => {
    setNatural(null);
  }, [active?.url]);

  const { x: focalX, y: focalY } = parseFocal(focal);
  const targetRatio = ASPECT_RATIO[aspect];
  const cropEnabled = fit === "cover" && targetRatio !== null && natural !== null;

  const geom = (() => {
    if (!natural) return null;
    const imageRatio = natural.w / natural.h;
    let imgW = MAX_PREVIEW_WIDTH;
    let imgH = MAX_PREVIEW_WIDTH / imageRatio;
    if (imgH > MAX_PREVIEW_HEIGHT) {
      imgH = MAX_PREVIEW_HEIGHT;
      imgW = MAX_PREVIEW_HEIGHT * imageRatio;
    }
    return { imgW, imgH, imageRatio };
  })();

  const crop = (() => {
    if (!geom || !cropEnabled || targetRatio === null) return null;
    const { imgW, imgH, imageRatio } = geom;
    let cropW: number;
    let cropH: number;
    if (imageRatio > targetRatio) {
      cropH = imgH;
      cropW = cropH * targetRatio;
    } else {
      cropW = imgW;
      cropH = cropW / targetRatio;
    }
    const availX = Math.max(0, imgW - cropW);
    const availY = Math.max(0, imgH - cropH);
    const left = (focalX / 100) * availX;
    const top = (focalY / 100) * availY;
    return { cropW, cropH, left, top, availX, availY };
  })();

  const handleImgLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    },
    []
  );

  useEffect(() => {
    if (!cropEnabled || !crop) return;
    if (crop.availX === 0 && focalX !== 50) onFocalChange(`50% ${focalY}%`);
    else if (crop.availY === 0 && focalY !== 50) onFocalChange(`${focalX}% 50%`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect, natural, activeIndex]);

  useEffect(() => {
    if (!drag || !crop) return;
    function handleMove(e: PointerEvent) {
      if (!drag || !crop) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const deltaPctX = crop.availX > 0 ? (dx / crop.availX) * 100 : 0;
      const deltaPctY = crop.availY > 0 ? (dy / crop.availY) * 100 : 0;
      const nx = Math.min(100, Math.max(0, drag.startFocalX + deltaPctX));
      const ny = Math.min(100, Math.max(0, drag.startFocalY + deltaPctY));
      onFocalChange(`${Math.round(nx)}% ${Math.round(ny)}%`);
    }
    function handleUp() {
      setDrag(null);
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [drag, crop, onFocalChange]);

  function beginDragFromCrop(e: React.PointerEvent) {
    if (!cropEnabled) return;
    e.preventDefault();
    setDrag({
      startX: e.clientX,
      startY: e.clientY,
      startFocalX: focalX,
      startFocalY: focalY,
    });
  }

  function clickOnStage(e: React.PointerEvent) {
    if (!cropEnabled || !geom || !crop || drag) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left - (rect.width - geom.imgW) / 2;
    const py = e.clientY - rect.top - (rect.height - geom.imgH) / 2;
    const targetLeft = Math.min(crop.availX, Math.max(0, px - crop.cropW / 2));
    const targetTop = Math.min(crop.availY, Math.max(0, py - crop.cropH / 2));
    const nx = crop.availX > 0 ? (targetLeft / crop.availX) * 100 : 50;
    const ny = crop.availY > 0 ? (targetTop / crop.availY) * 100 : 50;
    onFocalChange(`${Math.round(nx)}% ${Math.round(ny)}%`);
  }

  if (!active) return null;

  return (
    <div className="space-y-4 rounded-xl border border-church-border bg-church-bg/40 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-church-text">
            이미지 표시 설정
          </p>
          <p className="text-[11.5px] text-church-muted mt-0.5 leading-relaxed">
            각 이미지별로 공개 화면에 보일 영역을 따로 지정할 수 있어요.
          </p>
        </div>
        {cropEnabled && (
          <button
            type="button"
            onClick={() => onFocalChange("50% 50%")}
            className="focus-ring text-[11.5px] text-church-muted hover:text-church-text underline decoration-dotted underline-offset-2 cursor-pointer"
          >
            이 이미지 중앙으로 재설정
          </button>
        )}
      </div>

      {/* Thumbnail strip — select which image to adjust */}
      {images.length > 1 && (
        <div className="space-y-1.5">
          <p className="text-[11.5px] font-mono uppercase tracking-widest text-church-muted">
            편집할 이미지 ({activeIndex + 1} / {images.length})
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
            {images.map((img, i) => {
              const selected = i === activeIndex;
              const customFocal = img.focal !== "50% 50%";
              return (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => onActiveIndexChange(i)}
                  aria-pressed={selected}
                  aria-label={`이미지 ${i + 1} 편집`}
                  className={`relative shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-colors cursor-pointer focus-ring ${
                    selected
                      ? "border-church-accent ring-2 ring-church-accent-soft"
                      : "border-church-border hover:border-church-muted/50"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] font-mono font-medium text-white bg-black/55 tabular-nums">
                    {i + 1}
                  </span>
                  {customFocal && (
                    <span
                      aria-hidden="true"
                      title="커스텀 초점 설정됨"
                      className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-church-accent ring-1 ring-white"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stage */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[11.5px] font-mono uppercase tracking-widest text-church-muted">
            미리보기
          </p>
          <p className="text-[11.5px] text-church-muted">
            {fit === "contain"
              ? "이미지 전체가 공개 화면에 표시됩니다"
              : aspect === "original"
              ? "원본 비율로 표시되어 잘리지 않습니다"
              : "프레임 안쪽이 공개 화면에 보이는 영역입니다"}
          </p>
        </div>

        <div
          ref={stageRef}
          onPointerDown={clickOnStage}
          style={{
            height: `${MAX_PREVIEW_HEIGHT}px`,
            maxWidth: `${MAX_PREVIEW_WIDTH}px`,
          }}
          className={`relative w-full mx-auto rounded-xl overflow-hidden border border-church-border bg-church-text/5 flex items-center justify-center ${
            cropEnabled ? "cursor-crosshair" : ""
          }`}
        >
          {geom && (
            <div
              className="relative"
              style={{ width: `${geom.imgW}px`, height: `${geom.imgH}px` }}
            >
              <Image
                src={active.url}
                alt=""
                fill
                sizes="600px"
                className="object-contain select-none pointer-events-none"
              />

              {cropEnabled && crop && (
                <>
                  <div
                    aria-hidden="true"
                    className="absolute pointer-events-none border-2 border-white rounded-xs"
                    style={{
                      left: `${crop.left}px`,
                      top: `${crop.top}px`,
                      width: `${crop.cropW}px`,
                      height: `${crop.cropH}px`,
                      boxShadow:
                        "0 0 0 9999px rgba(0, 0, 0, 0.55), inset 0 0 0 1px rgba(0,0,0,0.25)",
                    }}
                  />

                  <div
                    aria-hidden="true"
                    className="absolute pointer-events-none"
                    style={{
                      left: `${crop.left}px`,
                      top: `${crop.top}px`,
                      width: `${crop.cropW}px`,
                      height: `${crop.cropH}px`,
                    }}
                  >
                    <div className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
                    <div className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
                    <div className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
                    <div className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
                  </div>

                  {(["tl", "tr", "bl", "br"] as const).map((corner) => {
                    const pos =
                      corner === "tl"
                        ? { left: crop.left, top: crop.top }
                        : corner === "tr"
                        ? { left: crop.left + crop.cropW, top: crop.top }
                        : corner === "bl"
                        ? { left: crop.left, top: crop.top + crop.cropH }
                        : {
                            left: crop.left + crop.cropW,
                            top: crop.top + crop.cropH,
                          };
                    return (
                      <span
                        key={corner}
                        aria-hidden="true"
                        className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white shadow pointer-events-none"
                        style={pos}
                      />
                    );
                  })}

                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="크롭 영역 이동 (드래그)"
                    onPointerDown={beginDragFromCrop}
                    onKeyDown={(e) => {
                      const step = e.shiftKey ? 10 : 2;
                      if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        onFocalChange(
                          `${Math.max(0, focalX - step)}% ${focalY}%`
                        );
                      } else if (e.key === "ArrowRight") {
                        e.preventDefault();
                        onFocalChange(
                          `${Math.min(100, focalX + step)}% ${focalY}%`
                        );
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        onFocalChange(
                          `${focalX}% ${Math.max(0, focalY - step)}%`
                        );
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        onFocalChange(
                          `${focalX}% ${Math.min(100, focalY + step)}%`
                        );
                      }
                    }}
                    className={`absolute focus-ring ${
                      drag ? "cursor-grabbing" : "cursor-grab"
                    }`}
                    style={{
                      left: `${crop.left}px`,
                      top: `${crop.top}px`,
                      width: `${crop.cropW}px`,
                      height: `${crop.cropH}px`,
                    }}
                  />
                </>
              )}
            </div>
          )}

          {/* Hidden preloader — reloads when active image URL changes */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={active.url}
            src={active.url}
            alt=""
            onLoad={handleImgLoad}
            className="sr-only"
          />

          {geom && (
            <span className="absolute top-2 left-2 pill bg-black/60 text-white font-mono tabular-nums">
              #{activeIndex + 1} · {fit === "cover" ? "꽉 채우기" : "여백 유지"}
              {cropEnabled && ` · ${focalX}, ${focalY}`}
            </span>
          )}

          {natural && (
            <span className="absolute top-2 right-2 pill bg-black/50 text-white font-mono tabular-nums">
              {natural.w} × {natural.h}
            </span>
          )}

          {!natural && (
            <div className="absolute inset-0 flex items-center justify-center text-[12px] text-church-muted">
              이미지 불러오는 중…
            </div>
          )}
        </div>
      </div>

      {/* Aspect ratio */}
      <div className="space-y-1.5">
        <p className="text-[11.5px] font-mono uppercase tracking-widest text-church-muted">
          비율 (모든 이미지에 공통)
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {IMAGE_ASPECTS.map((a) => {
            const selected = aspect === a;
            const tile = MINI_TILE[a];
            return (
              <button
                key={a}
                type="button"
                onClick={() => onAspectChange(a)}
                aria-pressed={selected}
                aria-label={a}
                className={`focus-ring group flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                  selected
                    ? "border-church-text bg-church-text/5"
                    : "border-church-border bg-white hover:border-church-muted/40"
                }`}
              >
                <span
                  aria-hidden="true"
                  style={{ width: tile.w, height: tile.h }}
                  className={`block rounded-xs transition-colors ${
                    selected
                      ? "bg-church-text"
                      : "bg-church-border group-hover:bg-church-muted/50"
                  }`}
                />
                <span
                  className={`text-[11px] font-medium tabular-nums ${
                    selected ? "text-church-text" : "text-church-muted"
                  }`}
                >
                  {a === "original" ? "원본" : a}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fit */}
      <div className="space-y-1.5">
        <p className="text-[11.5px] font-mono uppercase tracking-widest text-church-muted">
          맞춤 방식 (모든 이미지에 공통)
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <FitOption
            active={fit === "cover"}
            onClick={() => onFitChange("cover")}
            title="꽉 채우기"
            description="프레임을 채우며 일부가 잘릴 수 있어요"
            icon={
              <svg viewBox="0 0 32 20" className="w-8 h-5" aria-hidden="true">
                <rect x="0" y="0" width="32" height="20" rx="2" className="fill-current" />
                <rect x="3" y="3" width="26" height="14" rx="1" className="fill-white/20" />
              </svg>
            }
          />
          <FitOption
            active={fit === "contain"}
            onClick={() => onFitChange("contain")}
            title="여백 유지"
            description="이미지 전체가 보이며 여백이 생길 수 있어요"
            icon={
              <svg viewBox="0 0 32 20" className="w-8 h-5" aria-hidden="true">
                <rect
                  x="0.5"
                  y="0.5"
                  width="31"
                  height="19"
                  rx="1.5"
                  className="fill-none stroke-current"
                  strokeDasharray="2 2"
                />
                <rect x="6" y="2" width="20" height="16" rx="1" className="fill-current" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}

function FitOption({
  active,
  onClick,
  title,
  description,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`focus-ring flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
        active
          ? "border-church-text bg-church-text/5"
          : "border-church-border bg-white hover:border-church-muted/40"
      }`}
    >
      <span
        className={`shrink-0 mt-0.5 ${
          active ? "text-church-text" : "text-church-muted"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span
          className={`block text-[12.5px] font-medium ${
            active ? "text-church-text" : "text-church-text/80"
          }`}
        >
          {title}
        </span>
        <span className="block text-[11px] text-church-muted leading-snug mt-0.5">
          {description}
        </span>
      </span>
    </button>
  );
}
