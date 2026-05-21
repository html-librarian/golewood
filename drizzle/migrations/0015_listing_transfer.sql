ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "transfer_offered" boolean NOT NULL DEFAULT false;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "transfer_price" integer;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "transfer_price_on_request" boolean NOT NULL DEFAULT false;

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "transfer_requested" boolean NOT NULL DEFAULT false;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "transfer_price" integer NOT NULL DEFAULT 0;

UPDATE "listings" SET "cleaning_fee" = 0;
