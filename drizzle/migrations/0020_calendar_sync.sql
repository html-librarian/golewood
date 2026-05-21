ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "calendar_export_token" uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS "listings_calendar_export_token_idx"
  ON "listings" ("calendar_export_token");

CREATE TABLE IF NOT EXISTS "listing_calendar_feeds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
  "label" varchar(128) NOT NULL,
  "feed_url" text NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  "last_synced_at" timestamptz,
  "last_sync_error" text NOT NULL DEFAULT '',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "listing_calendar_feeds_listing_idx"
  ON "listing_calendar_feeds" ("listing_id");

ALTER TABLE "listing_blocks"
  ADD COLUMN IF NOT EXISTS "source" varchar(16) NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "feed_id" uuid REFERENCES "listing_calendar_feeds"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "external_uid" varchar(255);

CREATE UNIQUE INDEX IF NOT EXISTS "listing_blocks_listing_external_uid_idx"
  ON "listing_blocks" ("listing_id", "external_uid")
  WHERE "external_uid" IS NOT NULL;
