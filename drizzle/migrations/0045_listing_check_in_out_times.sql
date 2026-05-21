ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "check_in_time" varchar(5) NOT NULL DEFAULT '15:00',
  ADD COLUMN IF NOT EXISTS "check_out_time" varchar(5) NOT NULL DEFAULT '12:00';
