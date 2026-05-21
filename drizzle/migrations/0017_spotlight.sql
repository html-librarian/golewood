DO $$ BEGIN
  CREATE TYPE "spotlight_photo_status" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "spotlight_months" (
  "month_key" varchar(7) PRIMARY KEY NOT NULL,
  "winner_photo_id" uuid,
  "closed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "spotlight_photos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
  "image_url" varchar(512) NOT NULL,
  "caption" text NOT NULL DEFAULT '',
  "status" "spotlight_photo_status" NOT NULL DEFAULT 'pending',
  "month_key" varchar(7) NOT NULL,
  "vote_count" integer NOT NULL DEFAULT 0,
  "consent_given" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "spotlight_votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "photo_id" uuid NOT NULL REFERENCES "spotlight_photos"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "month_key" varchar(7) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "spotlight_votes_user_month_unique" UNIQUE ("user_id", "month_key")
);

ALTER TABLE "spotlight_months"
  ADD CONSTRAINT "spotlight_months_winner_photo_id_fk"
  FOREIGN KEY ("winner_photo_id") REFERENCES "spotlight_photos"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "spotlight_photos_month_status_idx" ON "spotlight_photos" ("month_key", "status");
CREATE INDEX IF NOT EXISTS "spotlight_photos_listing_idx" ON "spotlight_photos" ("listing_id");
