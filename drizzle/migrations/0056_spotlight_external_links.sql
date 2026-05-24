ALTER TABLE "spotlight_photos" ALTER COLUMN "listing_id" DROP NOT NULL;

ALTER TABLE "spotlight_photos" ADD COLUMN IF NOT EXISTS "place_name" varchar(255);
ALTER TABLE "spotlight_photos" ADD COLUMN IF NOT EXISTS "external_site_url" varchar(512);
ALTER TABLE "spotlight_photos" ADD COLUMN IF NOT EXISTS "external_instagram" varchar(255);
