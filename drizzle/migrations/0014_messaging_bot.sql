ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "is_system" boolean NOT NULL DEFAULT false;

INSERT INTO "users" ("id", "phone", "email", "name", "role")
VALUES (
  '00000000-0000-4000-8000-000000000001',
  '+79000000999',
  'bot@golewood.local',
  'Golewood',
  'guest'
)
ON CONFLICT ("phone") DO UPDATE SET
  "name" = EXCLUDED."name",
  "email" = EXCLUDED."email";
