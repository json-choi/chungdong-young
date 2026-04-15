-- Per-announcement image presentation settings.
-- image_aspect: display aspect ratio (16:9, 4:3, 1:1, 3:4, original)
-- image_fit:    cover (crop to fill) or contain (letterbox)

ALTER TABLE "announcements"
  ADD COLUMN "image_aspect" text NOT NULL DEFAULT '16:9',
  ADD COLUMN "image_fit" text NOT NULL DEFAULT 'cover';
