ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "contacts" jsonb NOT NULL DEFAULT '{}';
