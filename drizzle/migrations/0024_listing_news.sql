CREATE TABLE IF NOT EXISTS "listing_news" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
  "host_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" varchar(255) NOT NULL,
  "body" text NOT NULL,
  "excerpt" text NOT NULL DEFAULT '',
  "status" "blog_post_status" NOT NULL DEFAULT 'draft',
  "published_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "listing_news_listing_id_idx" ON "listing_news" ("listing_id");
