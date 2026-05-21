CREATE TABLE IF NOT EXISTS "review_replies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "review_id" uuid NOT NULL REFERENCES "reviews"("id") ON DELETE CASCADE,
  "parent_reply_id" uuid REFERENCES "review_replies"("id") ON DELETE CASCADE,
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "text" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "review_replies_review_id_idx" ON "review_replies" ("review_id");
CREATE INDEX IF NOT EXISTS "review_replies_parent_reply_id_idx" ON "review_replies" ("parent_reply_id");
