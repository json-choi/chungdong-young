"use client";

import { useEffect, useState } from "react";

type ThemeChoice = "light" | "dark" | "system";

/**
 * Dev-only theme switcher. Rendered as a small floating segmented control
 * bottom-right. Writes `localStorage["theme"]` + toggles `.dark` class on
 * `<html>`. The bootstrap script in root layout reads the same value before
 * paint, so refreshing preserves the choice without FOUC.
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem("theme") as ThemeChoice | null) ?? "system";
    setChoice(stored);
  }, []);

  // Apply choice: update class + persist
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (choice === "system") {
      localStorage.setItem("theme", "system");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
      return;
    }

    localStorage.setItem("theme", choice);
    root.classList.toggle("dark", choice === "dark");
  }, [choice, mounted]);

  // When on "system", follow OS changes live
  useEffect(() => {
    if (!mounted || choice !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [choice, mounted]);

  if (!mounted) return null;

  const options: { id: ThemeChoice; label: string; icon: React.ReactNode }[] = [
    {
      id: "light",
      label: "라이트",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ),
    },
    {
      id: "system",
      label: "시스템",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path strokeLinecap="round" d="M8 20h8M12 16v4" />
        </svg>
      ),
    },
    {
      id: "dark",
      label: "다크",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="fixed bottom-3 right-3 z-50 flex items-center gap-0.5 rounded-full border border-church-border bg-church-surface/90 backdrop-blur px-1 py-1 shadow-[0_4px_12px_rgba(15,23,42,0.15)]"
      role="group"
      aria-label="테마 전환 (개발용)"
    >
      {options.map((opt) => {
        const active = choice === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setChoice(opt.id)}
            aria-pressed={active}
            aria-label={opt.label}
            title={opt.label}
            className={`focus-ring inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors cursor-pointer ${
              active
                ? "bg-church-text text-church-surface"
                : "text-church-muted hover:text-church-text"
            }`}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}
