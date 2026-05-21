ALTER TABLE "refresh_tokens"
  ADD COLUMN IF NOT EXISTS "user_agent" text,
  ADD COLUMN IF NOT EXISTS "last_used_at" timestamptz NOT NULL DEFAULT now();

UPDATE "refresh_tokens"
SET "last_used_at" = "created_at"
WHERE "last_used_at" IS NULL;
