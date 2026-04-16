"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeChoice = "light" | "dark" | "system";
const THEME_KEY = "theme";

// Subscribe to cross-tab updates via the `storage` event. Same-tab updates
// are fanned out manually from `cycle()` because `storage` does not fire in
// the tab that made the change.
function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getClientSnapshot(): ThemeChoice {
  return (localStorage.getItem(THEME_KEY) as ThemeChoice | null) ?? "system";
}

function getServerSnapshot(): ThemeChoice {
  return "system";
}

// Derived from useSyncExternalStore: server snapshot is `false`, client
// snapshot is `true`. Effectively `mounted` without writing state in an effect.
const NEVER_CHANGES = () => () => {};
function useHasMounted(): boolean {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false
  );
}

/**
 * Theme toggle button suitable for embedding in a header or sidebar.
 *
 * Single button cycles: light → dark → system → light. Writes
 * `localStorage["theme"]` + toggles `.dark` on `<html>`. The inline bootstrap
 * script in the root layout reads the same value before paint, so refreshing
 * preserves the choice without FOUC.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const choice = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const mounted = useHasMounted();

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (choice === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      root.classList.toggle("dark", prefersDark);
      return;
    }

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

  const cycle = useCallback(() => {
    const next: ThemeChoice =
      choice === "light" ? "dark" : choice === "dark" ? "system" : "light";
    localStorage.setItem(THEME_KEY, next);
    // `storage` does not fire in the originating tab — dispatch manually so
    // `useSyncExternalStore` observes the new snapshot immediately.
    window.dispatchEvent(new StorageEvent("storage", { key: THEME_KEY }));
  }, [choice]);

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
