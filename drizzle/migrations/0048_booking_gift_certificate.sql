ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "gift_certificate_purchase_id" uuid REFERENCES "gift_certificate_purchases"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "gift_certificate_credit" integer NOT NULL DEFAULT 0;
