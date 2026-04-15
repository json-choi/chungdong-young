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
      className="focus-ring inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-lg border border-church-border bg-church-surface text-sm font-medium text-church-text hover:bg-church-border-soft transition-colors disabled:opacity-60 cursor-pointer"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-1.41-1.41m0-8.632a3 3 0 101.41-1.41M9 12l6-3m0 0v6l-6-3" />
      </svg>
      공유
    </button>
  );
}
