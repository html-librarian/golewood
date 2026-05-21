CREATE TABLE IF NOT EXISTS "host_google_calendar_credentials" (
  "user_id" uuid PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "refresh_token" text NOT NULL,
  "google_email" varchar(255),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "listing_calendar_feeds"
  ADD COLUMN IF NOT EXISTS "feed_type" varchar(16) NOT NULL DEFAULT 'ical',
  ADD COLUMN IF NOT EXISTS "google_calendar_id" varchar(255);
