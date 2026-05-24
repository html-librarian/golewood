ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name" varchar(64);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name" varchar(64);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "patronymic" varchar(64);

UPDATE "users"
SET
  "last_name" = split_part(trim("name"), ' ', 1),
  "first_name" = NULLIF(split_part(trim("name"), ' ', 2), ''),
  "patronymic" = CASE
    WHEN cardinality(regexp_split_to_array(trim("name"), '\s+')) >= 3
      THEN trim(substring(trim("name") from length(split_part(trim("name"), ' ', 1)) + length(split_part(trim("name"), ' ', 2)) + 3))
    ELSE NULL
  END
WHERE "name" IS NOT NULL
  AND trim("name") <> ''
  AND ("last_name" IS NULL OR "first_name" IS NULL);
