"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

const PREFIX = "announcement-draft:";

interface DraftEnvelope<T> {
  version: 1;
  savedAt: number;
  data: T;
}

interface UseDraftResult {
  /** Saved timestamp of the last persisted snapshot. `null` before first save. */
  savedAt: number | null;
  /** Explicitly remove the draft (call on successful submit). */
  clear: () => void;
}

/**
 * Debounced localStorage draft persistence. Reads a saved draft synchronously
 * on mount and calls `onRestore` once if found. Subsequently watches `data`
 * and writes after `debounceMs` of inactivity.
 *
 * Treats `localStorage` as the source of truth for `savedAt`: every write
 * dispatches a synthetic `storage` event so `useSyncExternalStore` picks up
 * the new timestamp without us mirroring it into React state.
 */
export function useDraft<T>(
  key: string,
  data: T,
  onRestore: (restored: T) => void,
  debounceMs = 600
): UseDraftResult {
  const storageKey = PREFIX + key;

  const onRestoreRef = useRef(onRestore);
  useEffect(() => {
    onRestoreRef.current = onRestore;
  });

  const savedAt = useSyncExternalStore(
    subscribeToStorage,
    () => readSavedAt(storageKey),
    () => null
  );

  // One-shot restore — fires once on mount, then never again for this key.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as DraftEnvelope<T>;
      if (parsed.version !== 1) return;
      onRestoreRef.current(parsed.data);
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
        notifyStorageChange(storageKey);
      } catch {
        // Quota exceeded or disabled — fail silent
      }
    }, debounceMs);

    return () => clearTimeout(handle);
  }, [storageKey, data, debounceMs]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      notifyStorageChange(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  return { savedAt, clear };
}

function subscribeToStorage(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readSavedAt(storageKey: string): number | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftEnvelope<unknown>;
    if (parsed.version !== 1) return null;
    return parsed.savedAt;
  } catch {
    return null;
  }
}

// `storage` events fire cross-tab only; dispatch manually so same-tab
// writers notify their own `useSyncExternalStore` subscribers.
function notifyStorageChange(storageKey: string): void {
  window.dispatchEvent(new StorageEvent("storage", { key: storageKey }));
}
