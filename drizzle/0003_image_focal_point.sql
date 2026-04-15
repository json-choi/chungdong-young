-- Per-announcement focal point for cover-mode cropping.
-- Stored as a CSS object-position string (e.g. "50% 50%", "25% 80%").
ALTER TABLE "announcements"
  ADD COLUMN "image_focal" text NOT NULL DEFAULT '50% 50%';
