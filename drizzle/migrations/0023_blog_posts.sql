DO $$ BEGIN
  CREATE TYPE "blog_post_status" AS ENUM('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(128) NOT NULL,
  "title_ru" varchar(255) NOT NULL,
  "title_en" varchar(255) NOT NULL,
  "excerpt_ru" text NOT NULL DEFAULT '',
  "excerpt_en" text NOT NULL DEFAULT '',
  "body_ru" text NOT NULL,
  "body_en" text NOT NULL DEFAULT '',
  "cover_image_url" varchar(512),
  "listing_id" uuid REFERENCES "listings"("id") ON DELETE SET NULL,
  "status" "blog_post_status" NOT NULL DEFAULT 'draft',
  "published_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_slug_unique" ON "blog_posts" ("slug");

ALTER TABLE "team_badge_catalog" ADD COLUMN IF NOT EXISTS "requires_blog_post" boolean NOT NULL DEFAULT false;

UPDATE "team_badge_catalog"
SET "requires_blog_post" = true
WHERE "slug" IN ('team_visited', 'team_approved');

ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "team_badge_blog_post_id" uuid REFERENCES "blog_posts"("id") ON DELETE SET NULL;
