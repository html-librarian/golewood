DO $$ BEGIN
  CREATE TYPE "story_media_type" AS ENUM ('image');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "user_stories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
  "media_url" varchar(512) NOT NULL,
  "media_type" "story_media_type" NOT NULL DEFAULT 'image',
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "listing_story_pins" (
  "listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
  "story_id" uuid NOT NULL REFERENCES "user_stories"("id") ON DELETE CASCADE,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "listing_story_pins_pkey" PRIMARY KEY ("listing_id", "story_id")
);

CREATE INDEX IF NOT EXISTS "user_stories_listing_expires_idx" ON "user_stories" ("listing_id", "expires_at");
CREATE INDEX IF NOT EXISTS "user_stories_user_expires_idx" ON "user_stories" ("user_id", "expires_at");
