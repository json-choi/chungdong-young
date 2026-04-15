"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/server/auth/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AdminSidebarProps {
  userName: string;
}

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const links = [
    { href: "/admin", label: "대시보드" },
    { href: "/admin/announcements", label: "공지사항 관리" },
    { href: "/admin/settings", label: "설정" },
  ];

  const nav = (
    <div className="flex flex-col h-full">
      <div className="p-5">
        <div className="inline-flex items-center gap-2.5">
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-church-text text-white text-sm font-bold"
            aria-hidden="true"
          >
            J
          </span>
          <span className="font-heading text-[15px] text-church-text">
            정동 젊은이 교회
          </span>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href) && link.href !== "/admin";

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive ? "page" : undefined}
              className={`focus-ring flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-church-text text-white"
                  : "text-church-muted hover:bg-church-border-soft hover:text-church-text"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="p-4 space-y-3">
        <p className="text-sm text-church-muted truncate">{userName}</p>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleSignOut}
        >
          로그아웃
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-church-border flex items-center justify-between px-3">
        <button
          className="focus-ring inline-flex items-center justify-center w-11 h-11 rounded-lg hover:bg-church-bg cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={mobileOpen}
        >
          <svg
            className="w-5 h-5 text-church-text"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <span className="font-heading text-[15px] text-church-navy">
          정동 젊은이 교회
        </span>
        <span className="w-11" aria-hidden="true" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-church-border transform transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {nav}
      </aside>
    </>
  );
}
