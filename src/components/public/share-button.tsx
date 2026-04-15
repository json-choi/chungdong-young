"use client";

import { useState } from "react";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
}

export function ShareButton({ title }: ShareButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    if (busy) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    setBusy(true);
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("링크가 복사되었어요");
      }
    } catch (err) {
      // User cancelled share — silent
      if ((err as Error)?.name !== "AbortError") {
        toast.error("공유에 실패했어요");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={busy}
      aria-label="공지 공유"
      title="공유"
      className="focus-ring inline-flex items-center justify-center w-10 h-10 rounded-full text-church-muted hover:text-church-text hover:bg-church-border-soft transition-colors disabled:opacity-60 cursor-pointer"
    >
      <svg
        className="w-4.5 h-4.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Lucide share-2 — three nodes connected by lines */}
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    </button>
  );
}
