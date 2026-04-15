"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/server/auth/client";
import { Separator } from "@/components/ui/separator";

interface AdminSidebarProps {
  userName: string;
}

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavLink[];
}

const IconDashboard = (
  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zM13 3v6h8V3h-8z" />
  </svg>
);

const IconMegaphone = (
  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);

const IconSettings = (
  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconLogout = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const IconExternal = (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const sections: NavSection[] = [
    {
      label: "콘텐츠",
      items: [
        { href: "/admin", label: "대시보드", icon: IconDashboard },
        { href: "/admin/announcements", label: "공지사항", icon: IconMegaphone },
      ],
    },
    {
      label: "계정",
      items: [{ href: "/admin/settings", label: "설정", icon: IconSettings }],
    },
  ];

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(href);

  const initials = userName.trim().charAt(0).toUpperCase() || "A";

  const nav = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4">
        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
          className="focus-ring inline-flex items-center gap-2.5 rounded-md"
          aria-label="관리자 홈"
        >
          <Image
            src="/logo.png"
            alt=""
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
            priority
          />
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-[14px] text-church-text">
              정동 젊은이 교회
            </span>
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-church-muted">
              Admin
            </span>
          </span>
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-3 overflow-y-auto" aria-label="관리자 내비게이션">
        {sections.map((section, idx) => (
          <div key={section.label} className={idx === 0 ? "" : "mt-5"}>
            <p className="px-3 pb-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-church-muted">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href} className="relative">
                    {active && (
                      <span
                        className="absolute left-0 top-1.5 bottom-1.5 w-0.75 rounded-r-full bg-church-accent"
                        aria-hidden="true"
                      />
                    )}
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`focus-ring flex items-center gap-2.5 pl-3 pr-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors cursor-pointer ${
                        active
                          ? "bg-church-accent-soft text-church-text"
                          : "text-church-muted hover:bg-church-border-soft hover:text-church-text"
                      }`}
                    >
                      <span
                        className={active ? "text-church-accent" : "text-church-muted"}
                        aria-hidden="true"
                      >
                        {link.icon}
                      </span>
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer — user + actions */}
      <div className="px-3 pb-4 pt-3">
        <Separator className="mb-3" />
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-church-border-soft text-church-text text-[13px] font-semibold shrink-0"
            aria-hidden="true"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-church-text truncate">
              {userName}
            </p>
            <p className="text-[11px] text-church-muted">관리자</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center justify-center gap-1.5 h-9 rounded-md border border-church-border text-[12.5px] font-medium text-church-muted hover:text-church-text hover:bg-church-border-soft transition-colors cursor-pointer"
          >
            {IconExternal}
            사이트
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="focus-ring inline-flex items-center justify-center gap-1.5 h-9 rounded-md border border-church-border text-[12.5px] font-medium text-church-muted hover:text-church-crimson hover:border-red-200 hover:bg-red-50/60 transition-colors cursor-pointer"
          >
            {IconLogout}
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-church-surface border-b border-church-border flex items-center justify-between px-3">
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
        <span className="inline-flex items-center gap-2">
          <Image
            src="/logo.png"
            alt=""
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
          />
          <span className="font-heading text-[15px] text-church-navy">
            정동 젊은이 교회
          </span>
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
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-church-surface border-r border-church-border transform transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {nav}
      </aside>
    </>
  );
}
