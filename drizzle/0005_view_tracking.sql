-- View tracking with per-day deduplication.
-- view_count is a denormalized counter kept in sync by the view endpoint.
-- announcement_views records one hashed visitor per post per day.

ALTER TABLE "announcements"
  ADD COLUMN "view_count" integer NOT NULL DEFAULT 0;

CREATE TABLE "announcement_views" (
  "announcement_id" uuid NOT NULL REFERENCES "announcements"("id") ON DELETE CASCADE,
  "visitor_hash" text NOT NULL,
  "viewed_date" date NOT NULL,
  "viewed_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "announcement_views_pk" PRIMARY KEY ("announcement_id", "visitor_hash", "viewed_date")
);

CREATE INDEX "announcement_views_announcement_idx"
  ON "announcement_views" ("announcement_id");
