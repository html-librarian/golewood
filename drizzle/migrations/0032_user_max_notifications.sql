ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "max_user_id" bigint;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "max_linked_at" timestamp with time zone;
