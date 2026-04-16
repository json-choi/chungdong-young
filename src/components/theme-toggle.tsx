"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeChoice = "light" | "dark" | "system";

/**
 * Theme toggle button suitable for embedding in a header or sidebar.
 *
 * Single button cycles: light → dark → system → light. Writes
 * `localStorage["theme"]` + toggles `.dark` on `<html>`. The inline bootstrap
 * script in the root layout reads the same value before paint, so refreshing
 * preserves the choice without FOUC.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    setMounted(true);
    const stored =
      (localStorage.getItem("theme") as ThemeChoice | null) ?? "system";
    setChoice(stored);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (choice === "system") {
      localStorage.setItem("theme", "system");
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      root.classList.toggle("dark", prefersDark);
      return;
    }

    localStorage.setItem("theme", choice);
    root.classList.toggle("dark", choice === "dark");
  }, [choice, mounted]);

  useEffect(() => {
    if (!mounted || choice !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", event.matches);
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [choice, mounted]);

  // Render an invisible placeholder during hydration to keep the header
  // layout stable — prevents a layout shift when the button appears.
  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className={cn("inline-block h-9 w-9", className)}
      />
    );
  }

  function cycle() {
    setChoice((prev) =>
      prev === "light" ? "dark" : prev === "dark" ? "system" : "light"
    );
  }

  const { icon, label } = describeChoice(choice);
  const nextLabel = describeChoice(
    choice === "light" ? "dark" : choice === "dark" ? "system" : "light"
  ).label;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`테마: ${label}. 눌러서 ${nextLabel}(으)로 전환`}
      title={`테마: ${label} (눌러서 ${nextLabel})`}
      className={cn(
        "focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full text-church-muted transition-colors cursor-pointer",
        "hover:bg-church-border-soft hover:text-church-text",
        className
      )}
    >
      {icon}
    </button>
  );
}

function describeChoice(choice: ThemeChoice): {
  icon: React.ReactNode;
  label: string;
} {
  switch (choice) {
    case "light":
      return { icon: <Sun className="size-4" />, label: "라이트" };
    case "dark":
      return { icon: <Moon className="size-4" />, label: "다크" };
    default:
      return { icon: <Monitor className="size-4" />, label: "시스템" };
  }
}
