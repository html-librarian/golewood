ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "extra_guests_offered" boolean NOT NULL DEFAULT false;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "max_guests_with_extra" integer;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "extra_guest_price_per_night" integer;
