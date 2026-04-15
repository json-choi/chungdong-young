"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PageHeader } from "@/components/admin/page-header";

const sections = [
  { id: "account", label: "아이디 (이메일)" },
  { id: "password", label: "비밀번호" },
  { id: "danger", label: "위험 구역", tone: "danger" as const },
];

export default function AdminSettingsPage() {
  const router = useRouter();

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Reset data
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const deleteKeywordMatches = resetConfirm.trim() === "DELETE";

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("새 비밀번호가 일치하지 않습니다");
      return;
    }

    setSavingPw(true);

    try {
      const res = await fetch("/api/admin/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }

      toast.success("비밀번호가 변경되었습니다");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다"
      );
    } finally {
      setSavingPw(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingEmail(true);

    try {
      const res = await fetch("/api/admin/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail,
          currentPassword: emailPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }

      toast.success(
        "이메일(아이디)이 변경되었습니다. 다음 로그인부터 새 이메일을 사용하세요"
      );
      setNewEmail("");
      setEmailPassword("");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "이메일 변경에 실패했습니다"
      );
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleReset() {
    if (!deleteKeywordMatches) {
      toast.error("확인 문구를 정확히 입력해주세요 (DELETE)");
      return;
    }

    setResetting(true);

    try {
      const res = await fetch("/api/admin/announcements/reset", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }

      const data = await res.json();
      toast.success(
        data.blobCleanupError
          ? `${data.deleted}건의 공지사항은 삭제되었지만 이미지 정리에 일부 실패했습니다`
          : `${data.deleted}건의 공지사항과 ${data.blobsDeleted}개의 이미지가 삭제되었습니다`
      );
      setResetConfirm("");
      setResetDialogOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제에 실패했습니다");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="설정"
        description="계정 정보와 데이터 관리 옵션을 설정합니다."
      />

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        {/* Section nav — anchors on desktop */}
        <aside className="hidden lg:block">
          <nav className="sticky top-6 space-y-0.5" aria-label="설정 섹션">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`focus-ring block px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors cursor-pointer ${
                  s.tone === "danger"
                    ? "text-church-muted hover:text-church-crimson hover:bg-red-50/60"
                    : "text-church-muted hover:text-church-text hover:bg-church-border-soft"
                }`}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-6 max-w-2xl">
          {/* Email change */}
          <section
            id="account"
            className="card-base p-6 scroll-mt-6"
            aria-labelledby="settings-account-title"
          >
            <header className="mb-5">
              <h2
                id="settings-account-title"
                className="font-heading text-[17px] text-church-text"
              >
                아이디 (이메일)
              </h2>
              <p className="text-[13px] text-church-muted mt-1 leading-relaxed">
                로그인 아이디는 이메일과 동일합니다. 변경 후 다음 로그인부터 새
                이메일을 사용하세요.
              </p>
            </header>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">새 이메일</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="new-admin@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailPassword">현재 비밀번호</Label>
                <Input
                  id="emailPassword"
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="bg-church-text hover:bg-church-navy-light text-church-surface cursor-pointer"
                disabled={savingEmail || !newEmail.trim() || !emailPassword}
              >
                {savingEmail ? "변경 중..." : "아이디 변경"}
              </Button>
            </form>
          </section>

          {/* Password change */}
          <section
            id="password"
            className="card-base p-6 scroll-mt-6"
            aria-labelledby="settings-password-title"
          >
            <header className="mb-5">
              <h2
                id="settings-password-title"
                className="font-heading text-[17px] text-church-text"
              >
                비밀번호
              </h2>
              <p className="text-[13px] text-church-muted mt-1 leading-relaxed">
                최소 8자 이상의 새 비밀번호를 설정하세요.
              </p>
            </header>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">현재 비밀번호</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="bg-church-text hover:bg-church-navy-light text-church-surface cursor-pointer"
                disabled={savingPw}
              >
                {savingPw ? "변경 중..." : "비밀번호 변경"}
              </Button>
            </form>
          </section>

          {/* Danger zone */}
          <section
            id="danger"
            className="rounded-2xl border border-red-200 bg-red-50/40 p-6 scroll-mt-6"
            aria-labelledby="settings-danger-title"
          >
            <header className="mb-4 flex items-start gap-3">
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-church-crimson shrink-0"
                aria-hidden="true"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <div>
                <h2
                  id="settings-danger-title"
                  className="font-heading text-[17px] text-church-crimson"
                >
                  위험 구역
                </h2>
                <p className="text-[13px] text-church-muted mt-1 leading-relaxed">
                  아래 작업은 되돌릴 수 없습니다. 신중하게 진행하세요.
                </p>
              </div>
            </header>

            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-church-surface p-5 space-y-4">
              <div>
                <p className="font-medium text-church-text">모든 공지사항 삭제</p>
                <p className="text-[13px] text-church-muted leading-relaxed mt-1">
                  데이터베이스의 <strong>모든 공지사항</strong>과 업로드된{" "}
                  <strong>이미지</strong>를 영구적으로 삭제합니다. 관리자 계정은
                  유지됩니다.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resetConfirm">
                  확인을 위해{" "}
                  <span className="font-mono font-bold">DELETE</span> 를
                  입력하세요
                </Label>
                <Input
                  id="resetConfirm"
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
              <AlertDialog
                open={resetDialogOpen}
                onOpenChange={setResetDialogOpen}
              >
                <AlertDialogTrigger
                  className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                  disabled={resetting || !deleteKeywordMatches}
                >
                  {resetting ? "삭제 중..." : "모든 공지사항 삭제"}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      모든 공지사항과 Blob 이미지가 영구 삭제됩니다. 관리자
                      계정은 유지되지만, 이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      className="cursor-pointer"
                      disabled={resetting}
                    >
                      취소
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                      onClick={handleReset}
                      disabled={resetting}
                    >
                      최종 삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
