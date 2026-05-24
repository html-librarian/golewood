DO $$ BEGIN
  CREATE TYPE "home_promo_slot" AS ENUM ('featured', 'carousel');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "home_promo_background" AS ENUM ('image', 'gradient');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "home_promo_banners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slot" "home_promo_slot" NOT NULL,
  "title_ru" varchar(255),
  "title_en" varchar(255),
  "subtitle_ru" varchar(255),
  "subtitle_en" varchar(255),
  "cta_ru" varchar(64),
  "cta_en" varchar(64),
  "link_href" varchar(512) NOT NULL,
  "link_external" boolean NOT NULL DEFAULT false,
  "background_mode" "home_promo_background" NOT NULL DEFAULT 'gradient',
  "tone" varchar(160) NOT NULL DEFAULT 'from-brand-600 to-teal-700',
  "image_desktop_url" varchar(512),
  "image_tablet_url" varchar(512),
  "image_mobile_url" varchar(512),
  "active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "home_promo_banners_slot_sort_idx"
  ON "home_promo_banners" ("slot", "sort_order");
