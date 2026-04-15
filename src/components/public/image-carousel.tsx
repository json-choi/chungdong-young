"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ImageAspect, ImageFit } from "@/server/validation/announcement";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  aspect?: ImageAspect;
  fit?: ImageFit;
  /** CSS object-position per image (index-aligned). Only used when fit="cover". */
  focals?: string[];
}

const ASPECT_CLASSES: Record<ImageAspect, string> = {
  "16:9": "aspect-video",
  "4:3": "aspect-4/3",
  "1:1": "aspect-square",
  "3:4": "aspect-3/4",
  original: "aspect-2/1",
};

/**
 * Instagram-style swipeable image gallery. Dots appear BELOW the image
 * (not overlaid), no count badge. Uses native scroll-snap for mobile swipe
 * with keyboard/arrow support on desktop.
 */
export function ImageCarousel({
  images,
  alt,
  aspect = "16:9",
  fit = "cover",
  focals = [],
}: ImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const slides = Array.from(
      track.querySelectorAll<HTMLElement>("[data-slide]")
    );
    if (slides.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.slide ?? 0
            );
            setActive(idx);
          }
        }
      },
      { root: track, threshold: [0.6] }
    );

    slides.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [images.length]);

  function goTo(idx: number) {
    const track = trackRef.current;
    if (!track) return;
    const target = track.querySelector<HTMLElement>(`[data-slide="${idx}"]`);
    target?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  }

  const hasMultiple = images.length > 1;

  return (
    <div className="mb-5">
      {/* Image frame */}
      <div
        className={`relative w-full ${ASPECT_CLASSES[aspect]} rounded-2xl overflow-hidden bg-church-border-soft group`}
      >
        <div
          ref={trackRef}
          className="h-full w-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="region"
          aria-roledescription="carousel"
          aria-label={`${alt} 이미지 갤러리`}
        >
          {images.map((url, idx) => (
            <div
              key={url}
              data-slide={idx}
              className="relative shrink-0 w-full h-full snap-start"
              aria-roledescription="slide"
              aria-label={`${idx + 1} / ${images.length}`}
            >
              <Image
                src={url}
                alt={idx === 0 ? alt : ""}
                fill
                loading={idx === 0 ? "eager" : "lazy"}
                sizes="(max-width: 640px) 100vw, 672px"
                style={
                  fit === "cover"
                    ? { objectPosition: focals[idx] ?? "50% 50%" }
                    : undefined
                }
                className={fit === "cover" ? "object-cover" : "object-contain"}
                priority={idx === 0}
              />
            </div>
          ))}
        </div>

        {/* Arrow controls — desktop only, hover-revealed (Instagram style) */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => goTo(Math.max(0, active - 1))}
              disabled={active === 0}
              aria-label="이전 이미지"
              className="hidden sm:inline-flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-church-surface/90 text-church-text shadow-md items-center justify-center hover:bg-church-surface disabled:opacity-0 disabled:pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer focus-ring"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(Math.min(images.length - 1, active + 1))}
              disabled={active === images.length - 1}
              aria-label="다음 이미지"
              className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-church-surface/90 text-church-text shadow-md items-center justify-center hover:bg-church-surface disabled:opacity-0 disabled:pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer focus-ring"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Instagram-style dots — below the image, minimal */}
      {hasMultiple && (
        <div
          role="tablist"
          aria-label="이미지 선택"
          className="flex items-center justify-center gap-1.5 mt-3"
        >
          {images.map((_, idx) => {
            const isActive = idx === active;
            return (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`${idx + 1}번째 이미지`}
                onClick={() => goTo(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-colors cursor-pointer ${
                  isActive
                    ? "bg-church-accent"
                    : "bg-church-border hover:bg-church-muted/50"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
