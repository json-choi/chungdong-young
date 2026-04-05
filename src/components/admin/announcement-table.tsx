"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <div className="text-center py-12 text-church-muted">
        등록된 공지사항이 없습니다
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">순위</TableHead>
            <TableHead>제목</TableHead>
            <TableHead className="w-24">상태</TableHead>
            <TableHead className="w-36 hidden sm:table-cell">기간</TableHead>
            <TableHead className="w-32 text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm text-church-muted">
                {item.priority}
              </TableCell>
              <TableCell>
                <span className="font-medium">{item.title}</span>
                {item.imageUrl && (
                  <span className="ml-2 text-xs text-church-muted">
                    [이미지]
                  </span>
                )}
                {item.linkUrl && (
                  <span className="ml-1 text-xs text-church-muted">
                    [링크]
                  </span>
                )}
              </TableCell>
              <TableCell>
                {item.isPublished ? (
                  <Badge
                    variant="default"
                    className="bg-church-navy text-white"
                  >
                    게시중
                  </Badge>
                ) : (
                  <Badge variant="secondary">비공개</Badge>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm text-church-muted">
                {format(new Date(item.startAt), "MM.dd", { locale: ko })}
                {item.endAt &&
                  ` - ${format(new Date(item.endAt), "MM.dd", { locale: ko })}`}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Link href={`/admin/announcements/${item.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      수정
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger
                      className="inline-flex items-center justify-center h-8 px-3 text-sm text-church-crimson hover:text-church-crimson hover:bg-accent rounded-md"
                    >
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
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-church-crimson hover:bg-church-crimson/90"
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
