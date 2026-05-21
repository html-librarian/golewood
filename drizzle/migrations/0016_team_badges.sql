CREATE TABLE IF NOT EXISTS "team_badge_catalog" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(64) NOT NULL UNIQUE,
  "icon" varchar(128) NOT NULL,
  "title_ru" varchar(128) NOT NULL,
  "title_en" varchar(128) NOT NULL,
  "description_ru" text NOT NULL DEFAULT '',
  "description_en" text NOT NULL DEFAULT '',
  "active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "team_badge_id" uuid REFERENCES "team_badge_catalog"("id") ON DELETE SET NULL;

INSERT INTO "team_badge_catalog" ("slug", "icon", "title_ru", "title_en", "description_ru", "description_en", "sort_order")
VALUES
  (
    'team_visited',
    'ph:footprints-duotone',
    'Мы здесь отдыхали',
    'We stayed here',
    'Команда Golewood лично отдыхала в этом месте.',
    'The Golewood team has personally stayed at this property.',
    1
  ),
  (
    'team_approved',
    'ph:seal-check-duotone',
    'Одобрено Golewood',
    'Golewood approved',
    'Место проверено и рекомендовано командой Golewood.',
    'This property is vetted and recommended by the Golewood team.',
    2
  )
ON CONFLICT ("slug") DO NOTHING;
