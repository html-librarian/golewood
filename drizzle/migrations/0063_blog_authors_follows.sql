ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "author_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "city" varchar(128);

CREATE TABLE IF NOT EXISTS "blog_author_follows" (
  "follower_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "blog_author_follows_pkey" PRIMARY KEY ("follower_id", "author_id"),
  CONSTRAINT "blog_author_follows_no_self_follow" CHECK ("follower_id" <> "author_id")
);

CREATE INDEX IF NOT EXISTS "blog_posts_author_id_idx" ON "blog_posts" ("author_id");
CREATE INDEX IF NOT EXISTS "blog_posts_city_idx" ON "blog_posts" ("city");
CREATE INDEX IF NOT EXISTS "blog_author_follows_author_id_idx" ON "blog_author_follows" ("author_id");
