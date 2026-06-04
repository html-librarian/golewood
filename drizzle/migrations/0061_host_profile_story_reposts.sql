CREATE TABLE IF NOT EXISTS "host_profile_story_reposts" (
  "host_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "story_id" uuid NOT NULL REFERENCES "user_stories"("id") ON DELETE CASCADE,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "host_profile_story_reposts_pkey" PRIMARY KEY ("host_id", "story_id")
);

CREATE INDEX IF NOT EXISTS "host_profile_story_reposts_host_id_idx" ON "host_profile_story_reposts" ("host_id");
