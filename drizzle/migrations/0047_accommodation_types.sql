CREATE TABLE IF NOT EXISTS "accommodation_type_catalog" (
  "slug" varchar(64) PRIMARY KEY,
  "icon" varchar(64) NOT NULL,
  "label_ru" varchar(128) NOT NULL,
  "label_en" varchar(128) NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "active" boolean NOT NULL DEFAULT true
);

INSERT INTO "accommodation_type_catalog" ("slug", "icon", "label_ru", "label_en", "sort_order") VALUES
  ('eco_house', 'ph:leaf-duotone', 'Эко-дом', 'Eco house', 1),
  ('dome_house', 'ph:globe-hemisphere-east-duotone', 'Купольный дом', 'Dome house', 2),
  ('a_frame', 'ph:triangle-duotone', 'A-frame', 'A-frame', 3),
  ('treehouse', 'ph:tree-duotone', 'Дом на дереве', 'Treehouse', 4),
  ('barnhouse', 'ph:barn-duotone', 'Барнхаус', 'Barnhouse', 5),
  ('tent', 'ph:tent-duotone', 'Шатёр', 'Bell tent', 6),
  ('modular_house', 'ph:cube-duotone', 'Модульный дом', 'Modular house', 7),
  ('houseboat', 'ph:boat-duotone', 'Дом на воде', 'Houseboat', 8),
  ('safari_tent', 'ph:campfire-duotone', 'Сафари-тент', 'Safari tent', 9),
  ('tipi', 'ph:triangle-duotone', 'Типи', 'Tipi', 10),
  ('camper', 'ph:van-duotone', 'Кэмпер', 'Camper', 11),
  ('hotel_room', 'ph:bed-duotone', 'Номер', 'Hotel room', 12)
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "accommodation_type" varchar(64);

ALTER TABLE "listings"
  ADD CONSTRAINT "listings_accommodation_type_fk"
  FOREIGN KEY ("accommodation_type") REFERENCES "accommodation_type_catalog"("slug")
  ON DELETE SET NULL ON UPDATE CASCADE;
