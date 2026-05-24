ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "meta_title" varchar(255);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "meta_description" varchar(320);
