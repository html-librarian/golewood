CREATE TABLE IF NOT EXISTS "countries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(2) NOT NULL,
  "name_ru" varchar(128) NOT NULL,
  "name_en" varchar(128) NOT NULL,
  "active" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "countries_code_unique" ON "countries" ("code");

INSERT INTO "countries" ("code", "name_ru", "name_en", "active", "sort_order") VALUES
  ('RU', 'Россия', 'Russia', true, 1),
  ('BY', 'Беларусь', 'Belarus', false, 10),
  ('KZ', 'Казахстан', 'Kazakhstan', false, 20),
  ('AM', 'Армения', 'Armenia', false, 30),
  ('GE', 'Грузия', 'Georgia', false, 40),
  ('AZ', 'Азербайджан', 'Azerbaijan', false, 50),
  ('UZ', 'Узбекистан', 'Uzbekistan', false, 60),
  ('KG', 'Кыргызстан', 'Kyrgyzstan', false, 70),
  ('TJ', 'Таджикистан', 'Tajikistan', false, 80),
  ('MD', 'Молдова', 'Moldova', false, 90),
  ('TR', 'Турция', 'Turkey', false, 100),
  ('AE', 'ОАЭ', 'United Arab Emirates', false, 110),
  ('TH', 'Таиланд', 'Thailand', false, 120),
  ('FI', 'Финляндия', 'Finland', false, 130),
  ('EE', 'Эстония', 'Estonia', false, 140),
  ('LV', 'Латвия', 'Latvia', false, 150),
  ('LT', 'Литва', 'Lithuania', false, 160),
  ('DE', 'Германия', 'Germany', false, 170),
  ('FR', 'Франция', 'France', false, 180),
  ('IT', 'Италия', 'Italy', false, 190),
  ('ES', 'Испания', 'Spain', false, 200),
  ('GB', 'Великобритания', 'United Kingdom', false, 210),
  ('US', 'США', 'United States', false, 220),
  ('CN', 'Китай', 'China', false, 230)
ON CONFLICT ("code") DO NOTHING;

ALTER TABLE "cities" ADD COLUMN IF NOT EXISTS "country_id" uuid;

UPDATE "cities"
SET "country_id" = (SELECT "id" FROM "countries" WHERE "code" = 'RU')
WHERE "country_id" IS NULL;

ALTER TABLE "cities" ALTER COLUMN "country_id" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk"
    FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DROP INDEX IF EXISTS "cities_name_unique";

CREATE UNIQUE INDEX IF NOT EXISTS "cities_country_id_name_unique" ON "cities" ("country_id", "name");
