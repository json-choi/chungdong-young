"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authClient } from "@/server/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Phase = "idle" | "submitting" | "redirecting";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");

  // Prefetch the destination so post-login navigation is instant
  useEffect(() => {
    router.prefetch("/admin");
  }, [router]);

  const busy = phase !== "idle";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setPhase("submitting");

    try {
      const result = await authClient.signIn.email({ email, password });

      if (result.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다");
        setPhase("idle");
        return;
      }

      setPhase("redirecting");
      router.replace("/admin");
    } catch {
      setError("로그인에 실패했습니다");
      setPhase("idle");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-church-bg px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="정동 젊은이 교회"
              width={56}
              height={56}
              className="w-14 h-14 object-contain"
              priority
            />
          </div>
          <CardTitle className="font-heading text-xl text-church-text">
            관리자 로그인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={busy}
              />
            </div>
            {error && (
              <p
                role="alert"
                aria-live="polite"
                className="text-sm text-church-crimson"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-church-text hover:bg-church-navy-light text-church-surface cursor-pointer transition-transform active:scale-[0.98]"
              disabled={busy}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {busy ? (
                  <Spinner />
                ) : null}
                {phase === "submitting"
                  ? "로그인 중..."
                  : phase === "redirecting"
                  ? "이동 중..."
                  : "로그인"}
              </span>
            </Button>
          </form>
          <div className="mt-5 text-center">
            <Link
              href="/"
              className="focus-ring text-xs text-church-muted hover:text-church-text rounded"
            >
              ← 공지사항
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
