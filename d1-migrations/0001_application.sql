CREATE TABLE "user" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "email_verified" INTEGER NOT NULL CHECK ("email_verified" IN (0,1)) DEFAULT 0,
  "image" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  "banned" INTEGER CHECK ("banned" IN (0,1)) DEFAULT 0,
  "ban_reason" TEXT,
  "ban_expires" TEXT,
  CONSTRAINT "user_pkey" PRIMARY KEY (id)
);

CREATE TABLE "verification" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expires_at" TEXT NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  CONSTRAINT "verification_pkey" PRIMARY KEY (id)
);

CREATE TABLE "account" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "access_token_expires_at" TEXT,
  "refresh_token_expires_at" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "password" TEXT,
  "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT "account_pkey" PRIMARY KEY (id)
);

CREATE TABLE "announcements" (
  "id" TEXT NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  "title" TEXT NOT NULL,
  "body_html" TEXT NOT NULL,
  "link_url" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "start_at" TEXT NOT NULL,
  "end_at" TEXT,
  "is_published" INTEGER NOT NULL CHECK ("is_published" IN (0,1)) DEFAULT 0,
  "created_by" TEXT NOT NULL,
  "updated_by" TEXT NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  "deleted_at" TEXT,
  "is_all_day" INTEGER NOT NULL CHECK ("is_all_day" IN (0,1)) DEFAULT 0,
  "show_on_calendar" INTEGER NOT NULL CHECK ("show_on_calendar" IN (0,1)) DEFAULT 0,
  "event_start_at" TEXT,
  "event_end_at" TEXT,
  "show_on_feed" INTEGER NOT NULL CHECK ("show_on_feed" IN (0,1)) DEFAULT 1,
  "image_urls" TEXT NOT NULL CHECK ("image_urls" IS NULL OR (json_valid("image_urls") AND json_type("image_urls") = 'array')) DEFAULT '[]',
  "image_blob_paths" TEXT NOT NULL CHECK ("image_blob_paths" IS NULL OR (json_valid("image_blob_paths") AND json_type("image_blob_paths") = 'array')) DEFAULT '[]',
  "image_aspect" TEXT NOT NULL DEFAULT '16:9',
  "image_fit" TEXT NOT NULL DEFAULT 'cover',
  "image_focals" TEXT NOT NULL CHECK ("image_focals" IS NULL OR (json_valid("image_focals") AND json_type("image_focals") = 'array')) DEFAULT '[]',
  "view_count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "announcements_updated_by_user_id_fk" FOREIGN KEY (updated_by) REFERENCES "user"(id) ON DELETE RESTRICT,
  CONSTRAINT "announcements_created_by_user_id_fk" FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE RESTRICT,
  CONSTRAINT "announcements_pkey" PRIMARY KEY (id),
  CONSTRAINT "announcements_schedule_check" CHECK (((end_at IS NULL) OR (end_at >= start_at)))
);

CREATE TABLE "session" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires_at" TEXT NOT NULL,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT "session_pkey" PRIMARY KEY (id)
);

CREATE TABLE "announcement_views" (
  "announcement_id" TEXT NOT NULL,
  "visitor_hash" TEXT NOT NULL,
  "viewed_date" TEXT NOT NULL,
  "viewed_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  CONSTRAINT "announcement_views_announcement_id_fkey" FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  CONSTRAINT "announcement_views_pk" PRIMARY KEY (announcement_id, visitor_hash, viewed_date)
);

CREATE UNIQUE INDEX account_provider_account_unique ON account (provider_id, account_id);

CREATE INDEX account_user_id_idx ON account (user_id);

CREATE INDEX announcement_views_announcement_idx ON announcement_views (announcement_id);

CREATE INDEX announcements_deleted_at_idx ON announcements (deleted_at);

CREATE INDEX announcements_public_query_idx ON announcements (is_published, start_at, end_at, priority);

CREATE UNIQUE INDEX session_token_unique ON session (token);

CREATE INDEX session_user_id_idx ON session (user_id);

CREATE UNIQUE INDEX user_email_unique ON "user" (email);

CREATE INDEX verification_identifier_idx ON verification (identifier);
