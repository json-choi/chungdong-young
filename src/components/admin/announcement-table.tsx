"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { QrCodeDialog } from "./qr-code-dialog";
import type { Announcement } from "@/server/db/schema";

interface AnnouncementTableProps {
  announcements: Announcement[];
}

export function AnnouncementTable({ announcements }: AnnouncementTableProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      toast.success("공지가 삭제되었습니다");
      router.refresh();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  }

  if (announcements.length === 0) {
    return (
      <div className="card-base text-center py-16 px-4">
        <p className="font-heading text-base text-church-text">
          등록된 공지사항이 없습니다
        </p>
        <p className="text-sm text-church-muted mt-1">
          첫 공지를 작성해 보세요.
        </p>
        <Link href="/admin/announcements/new" className="mt-4 inline-block">
          <Button className="bg-church-text hover:bg-church-navy-light text-church-surface cursor-pointer">
            새 공지 작성
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="card-base overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-church-border bg-church-border-soft/40">
            <TableHead className="w-16 label-mono text-[11px]!">#</TableHead>
            <TableHead className="label-mono text-[11px]!">제목</TableHead>
            <TableHead className="w-24 label-mono text-[11px]!">상태</TableHead>
            <TableHead className="w-40 hidden sm:table-cell label-mono text-[11px]!">
              기간
            </TableHead>
            <TableHead className="w-32 text-right label-mono text-[11px]!">
              관리
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.map((item) => (
            <TableRow
              key={item.id}
              className="border-church-border-soft hover:bg-church-border-soft/50 transition-colors"
            >
              <TableCell>
                <span className="inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-md bg-church-border-soft font-mono text-[12px] text-church-muted tabular-nums">
                  {String(item.priority).padStart(2, "0")}
                </span>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/announcements/${item.id}/edit`}
                  className="focus-ring inline-flex items-center gap-2 group rounded"
                >
                  <span className="font-medium text-church-text group-hover:text-church-accent transition-colors">
                    {item.title}
                  </span>
                  <span className="flex gap-1">
                    {item.imageUrls.length > 0 && (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 h-5 rounded-md bg-church-border-soft text-church-muted"
                        title={`이미지 ${item.imageUrls.length}장`}
                        aria-label={`이미지 ${item.imageUrls.length}장`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {item.imageUrls.length > 1 && (
                          <span className="font-mono text-[10px] tabular-nums">
                            {item.imageUrls.length}
                          </span>
                        )}
                      </span>
                    )}
                    {item.linkUrl && (
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-church-border-soft text-church-muted"
                        title="외부 링크"
                        aria-label="외부 링크"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </span>
                    )}
                  </span>
                </Link>
              </TableCell>
              <TableCell>
                {item.isPublished ? (
                  <span className="pill bg-emerald-50 text-emerald-700">
                    <span className="pill-dot" />
                    게시중
                  </span>
                ) : (
                  <span className="pill bg-church-border-soft text-church-muted">
                    <span className="pill-dot" />
                    초안
                  </span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-[13px] text-church-muted font-mono tabular-nums">
                {format(new Date(item.startAt), "MM.dd", { locale: ko })}
                {item.endAt &&
                  ` → ${format(new Date(item.endAt), "MM.dd", { locale: ko })}`}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <QrCodeDialog
                    announcementId={item.id}
                    title={item.title}
                    isPublished={item.isPublished}
                    trigger={
                      <button
                        type="button"
                        aria-label={`${item.title} QR 코드`}
                        title="QR 코드"
                        className="focus-ring inline-flex items-center justify-center w-8 h-8 rounded-md text-church-muted hover:text-church-text hover:bg-church-border-soft transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m0 14v1m8-8h-1M5 12H4m11.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h3v3H7V7zM14 7h3v3h-3V7zM7 14h3v3H7v-3zM14 14h.01M17 14h.01M14 17h.01M17 17h.01" />
                        </svg>
                      </button>
                    }
                  />
                  <Link href={`/admin/announcements/${item.id}/edit`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                    >
                      수정
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger className="focus-ring inline-flex items-center justify-center h-8 px-3 text-sm text-church-crimson hover:bg-red-50 rounded-md transition-colors cursor-pointer">
                      삭제
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>공지 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          &quot;{item.title}&quot;을(를) 삭제하시겠습니까?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">
                          취소
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-church-crimson hover:bg-church-crimson/90 cursor-pointer"
                          onClick={() => handleDelete(item.id)}
                        >
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
