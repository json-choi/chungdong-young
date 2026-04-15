-- Multi-image gallery migration.
-- 1) Add new array columns with defaults
-- 2) Backfill from existing single-image columns
-- 3) Drop deprecated single-image columns

ALTER TABLE "announcements"
  ADD COLUMN "image_urls" text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN "image_blob_paths" text[] NOT NULL DEFAULT '{}'::text[];

-- Backfill: preserve existing single image as the first element of the gallery
UPDATE "announcements"
   SET "image_urls" = ARRAY["image_url"]
 WHERE "image_url" IS NOT NULL
   AND "image_url" <> '';

UPDATE "announcements"
   SET "image_blob_paths" = ARRAY["image_blob_path"]
 WHERE "image_blob_path" IS NOT NULL
   AND "image_blob_path" <> '';

ALTER TABLE "announcements"
  DROP COLUMN "image_url",
  DROP COLUMN "image_blob_path";
