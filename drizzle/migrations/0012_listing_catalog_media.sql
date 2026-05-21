CREATE TABLE IF NOT EXISTS "cities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(128) NOT NULL,
  "name_en" varchar(128),
  "active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "cities_name_unique" ON "cities" ("name");

CREATE TABLE IF NOT EXISTS "amenity_catalog" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(64) NOT NULL,
  "icon" varchar(128) NOT NULL,
  "label_ru" varchar(128) NOT NULL,
  "label_en" varchar(128) NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "amenity_catalog_slug_unique" ON "amenity_catalog" ("slug");

CREATE TABLE IF NOT EXISTS "listing_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
  "title" varchar(255) NOT NULL,
  "file_url" varchar(512) NOT NULL,
  "file_name" varchar(255) NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "listing_photos" ADD COLUMN IF NOT EXISTS "media_type" varchar(16) DEFAULT 'photo' NOT NULL;
ALTER TABLE "listing_photos" ADD COLUMN IF NOT EXISTS "embed_url" varchar(512);
ALTER TABLE "listing_photos" ADD COLUMN IF NOT EXISTS "provider" varchar(32);

CREATE TABLE IF NOT EXISTS "review_photos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "review_id" uuid NOT NULL REFERENCES "reviews"("id") ON DELETE CASCADE,
  "url" varchar(512) NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

INSERT INTO "cities" ("name", "name_en", "sort_order") VALUES
  ('Москва', 'Moscow', 1),
  ('Санкт-Петербург', 'Saint Petersburg', 2),
  ('Казань', 'Kazan', 3),
  ('Сочи', 'Sochi', 4)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "amenity_catalog" ("slug", "icon", "label_ru", "label_en", "sort_order") VALUES
  ('wifi', 'ph:wifi-high-duotone', 'Wi‑Fi', 'Wi‑Fi', 1),
  ('parking', 'ph:car-duotone', 'Парковка', 'Parking', 2),
  ('kitchen', 'ph:cooking-pot-duotone', 'Кухня', 'Kitchen', 3),
  ('washer', 'ph:washing-machine-duotone', 'Стиральная машина', 'Washer', 4),
  ('tv', 'ph:television-duotone', 'Телевизор', 'TV', 5),
  ('air_conditioning', 'ph:snowflake-duotone', 'Кондиционер', 'Air conditioning', 6),
  ('pets_allowed', 'ph:dog-duotone', 'Можно с животными', 'Pets allowed', 7),
  ('children_allowed', 'ph:baby-duotone', 'Подходит для детей', 'Children allowed', 8)
ON CONFLICT ("slug") DO NOTHING;
