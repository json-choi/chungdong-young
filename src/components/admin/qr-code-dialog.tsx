"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface QrCodeDialogProps {
  announcementId: string;
  title: string;
  /** Clickable element that opens the dialog. Must be a single React element. */
  trigger: React.ReactElement;
  /** Visible publish state — shows warning when not public */
  isPublished?: boolean;
}

export function QrCodeDialog({
  announcementId,
  title,
  trigger,
  isPublished = true,
}: QrCodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setUrl(`${window.location.origin}/announcements/${announcementId}`);
  }, [open, announcementId]);

  function handleDownloadPng() {
    const canvas = containerRef.current?.querySelector("canvas");
    if (!canvas) {
      toast.error("QR 코드를 찾을 수 없습니다");
      return;
    }
    const link = document.createElement("a");
    link.download = `qr-${title.slice(0, 30).replace(/[^\p{L}\p{N}_-]+/gu, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("PNG 다운로드 완료");
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("링크가 복사되었습니다");
    } catch {
      toast.error("복사에 실패했습니다");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="w-[min(420px,calc(100vw-2rem))] sm:max-w-md overflow-hidden">
        <DialogHeader className="min-w-0">
          <DialogTitle className="font-heading">QR 코드</DialogTitle>
          <DialogDescription className="truncate">{title}</DialogDescription>
        </DialogHeader>

        {!isPublished && (
          <p className="text-[13px] text-church-crimson bg-red-50 border border-red-200 rounded-md px-3 py-2">
            초안 상태입니다. QR 접근자는 공지를 볼 수 없어요. 먼저 게시해 주세요.
          </p>
        )}

        <div ref={containerRef} className="flex justify-center py-2">
          <div className="p-3 bg-white rounded-xl border border-church-border">
            {url ? (
              <QRCodeCanvas
                value={url}
                size={200}
                marginSize={0}
                level="M"
                imageSettings={{
                  src: "/logo.png",
                  width: 36,
                  height: 36,
                  excavate: true,
                }}
              />
            ) : (
              <div className="w-50 h-50 bg-church-border-soft animate-pulse rounded" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-church-border bg-church-border-soft/40 px-3 py-2 min-w-0">
          <code className="font-mono text-[12px] text-church-muted truncate min-w-0 flex-1">
            {url}
          </code>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="focus-ring shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-church-muted hover:text-church-text hover:bg-white transition-colors cursor-pointer"
            aria-label="링크 복사"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="cursor-pointer"
          >
            닫기
          </Button>
          <Button
            type="button"
            onClick={handleDownloadPng}
            className="bg-church-text hover:bg-church-navy-light text-church-surface cursor-pointer"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            PNG 다운로드
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
