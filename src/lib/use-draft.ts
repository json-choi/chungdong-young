"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PREFIX = "announcement-draft:";

interface DraftEnvelope<T> {
  version: 1;
  savedAt: number;
  data: T;
}

interface UseDraftResult<T> {
  /** Saved timestamp of the last persisted snapshot. `null` before first save. */
  savedAt: number | null;
  /** Explicitly remove the draft (call on successful submit). */
  clear: () => void;
}

/**
 * Debounced localStorage draft persistence. Reads a saved draft synchronously
 * on mount and calls `onRestore` once if found. Subsequently watches `data`
 * and writes after `debounceMs` of inactivity.
 */
export function useDraft<T>(
  key: string,
  data: T,
  onRestore: (restored: T) => void,
  debounceMs = 600
): UseDraftResult<T> {
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const restoredRef = useRef(false);
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  const storageKey = PREFIX + key;

  // One-shot restore
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as DraftEnvelope<T>;
      if (parsed.version !== 1) return;
      onRestoreRef.current(parsed.data);
      setSavedAt(parsed.savedAt);
    } catch {
      // Corrupt entry — ignore
    }
  }, [storageKey]);

  // Debounced write
  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        const envelope: DraftEnvelope<T> = {
          version: 1,
          savedAt: Date.now(),
          data,
        };
        localStorage.setItem(storageKey, JSON.stringify(envelope));
        setSavedAt(envelope.savedAt);
      } catch {
        // Quota exceeded or disabled — fail silent
      }
    }, debounceMs);

    return () => clearTimeout(handle);
  }, [storageKey, data, debounceMs]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setSavedAt(null);
    } catch {
      // ignore
    }
  }, [storageKey]);

  return { savedAt, clear };
}
