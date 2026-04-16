"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  announcementId: string;
}

/**
 * Fires once per mount to record a unique daily view.
 * Deduplication happens server-side against a hashed visitor fingerprint.
 * `keepalive` lets the request complete even if the user navigates away
 * right after paint.
 */
export function ViewTracker({ announcementId }: ViewTrackerProps) {
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        await fetch(`/api/announcements/${announcementId}/view`, {
          method: "POST",
          signal: controller.signal,
          keepalive: true,
        });
      } catch {
        // View tracking is best-effort — never block the reader.
      }
    };
    void run();
    return () => controller.abort();
  }, [announcementId]);

  return null;
}
