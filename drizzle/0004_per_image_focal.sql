-- Per-image focal points (object-position), index-aligned with image_urls.
-- Drops the single image_focal column after backfilling the new array.

ALTER TABLE "announcements"
  ADD COLUMN "image_focals" text[] NOT NULL DEFAULT '{}'::text[];

-- Backfill: replicate the single image_focal for each image in the gallery.
-- array_fill('50% 50%', ARRAY[n]) creates an n-length array of the same value.
UPDATE "announcements"
   SET "image_focals" = array_fill("image_focal", ARRAY[cardinality("image_urls")])
 WHERE cardinality("image_urls") > 0;

ALTER TABLE "announcements"
  DROP COLUMN "image_focal";
