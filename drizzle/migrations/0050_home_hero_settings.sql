CREATE TABLE IF NOT EXISTS "home_hero_settings" (
  "id" varchar(32) PRIMARY KEY DEFAULT 'default' NOT NULL,
  "mode" varchar(16) NOT NULL DEFAULT 'auto',
  "image_url" varchar(512),
  "credit_ru" varchar(255),
  "credit_en" varchar(255),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

INSERT INTO "home_hero_settings" ("id", "mode")
VALUES ('default', 'auto')
ON CONFLICT ("id") DO NOTHING;
