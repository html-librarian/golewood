CREATE TABLE IF NOT EXISTS "home_discovery_groups" (
  "id" varchar(32) PRIMARY KEY NOT NULL,
  "title_ru" varchar(128) NOT NULL,
  "title_en" varchar(128) NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "home_discovery_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "item_key" varchar(64) NOT NULL UNIQUE,
  "group_id" varchar(32) NOT NULL REFERENCES "home_discovery_groups"("id") ON DELETE CASCADE,
  "label_ru" varchar(128) NOT NULL,
  "label_en" varchar(128) NOT NULL,
  "icon" varchar(128) NOT NULL,
  "tone" varchar(160) NOT NULL,
  "params" jsonb NOT NULL DEFAULT '{}',
  "active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "home_discovery_items_group_sort_idx"
  ON "home_discovery_items" ("group_id", "sort_order");

INSERT INTO "home_discovery_groups" ("id", "title_ru", "title_en", "sort_order") VALUES
  ('destinations', 'Направления', 'Destinations', 0),
  ('comfort', 'Удобства', 'Amenities', 1),
  ('nature', 'Природа и виды', 'Nature & views', 2)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "home_discovery_items" ("item_key", "group_id", "label_ru", "label_en", "icon", "tone", "params", "sort_order") VALUES
  ('sochi', 'destinations', 'Сочи', 'Sochi', 'ph:sun-duotone', 'from-sky-400 to-cyan-600', '{"city":"Сочи"}', 0),
  ('kazan', 'destinations', 'Казань', 'Kazan', 'ph:mosque-duotone', 'from-emerald-500 to-teal-700', '{"city":"Казань"}', 1),
  ('krasnodar', 'destinations', 'Краснодар', 'Krasnodar', 'ph:plant-duotone', 'from-lime-500 to-green-700', '{"city":"Краснодар"}', 2),
  ('karelia', 'destinations', 'Карелия', 'Karelia', 'ph:tree-duotone', 'from-teal-600 to-emerald-800', '{"city":"Петрозаводск"}', 3),
  ('altai', 'destinations', 'Алтай', 'Altai', 'ph:mountains-duotone', 'from-indigo-500 to-violet-700', '{"city":"Горно-Алтайск"}', 4),
  ('spb', 'destinations', 'Санкт-Петербург', 'Saint Petersburg', 'ph:buildings-duotone', 'from-slate-500 to-slate-700', '{"city":"Санкт-Петербург"}', 5),
  ('moscow', 'destinations', 'Подмосковье', 'Moscow region', 'ph:house-line-duotone', 'from-stone-500 to-stone-700', '{"city":"Москва"}', 6),
  ('anapa', 'destinations', 'Анапа', 'Anapa', 'ph:beach-ball-duotone', 'from-amber-400 to-orange-600', '{"city":"Анапа"}', 7),
  ('pets', 'comfort', 'С питомцами', 'Pets allowed', 'ph:dog-duotone', 'from-amber-500 to-orange-600', '{"amenities":["pets_allowed"]}', 0),
  ('hot-tub', 'comfort', 'С чаном', 'Hot tub', 'ph:bathtub-duotone', 'from-rose-500 to-red-700', '{"amenities":["hot_tub"]}', 1),
  ('pool', 'comfort', 'С бассейном', 'Pool', 'ph:waves-duotone', 'from-blue-400 to-blue-700', '{"amenities":["pool"]}', 2),
  ('sauna', 'comfort', 'Баня / SPA', 'Sauna / spa', 'ph:thermometer-hot-duotone', 'from-orange-500 to-amber-700', '{"amenities":["sauna"]}', 3),
  ('children', 'comfort', 'Для детей', 'Family friendly', 'ph:baby-duotone', 'from-pink-400 to-rose-600', '{"amenities":["children_allowed","playground"]}', 4),
  ('grill', 'comfort', 'Мангал', 'BBQ', 'ph:fire-simple-duotone', 'from-red-500 to-orange-700', '{"amenities":["grill"]}', 5),
  ('parking', 'comfort', 'Парковка', 'Parking', 'ph:car-duotone', 'from-slate-400 to-slate-600', '{"amenities":["parking"]}', 6),
  ('wifi', 'comfort', 'Wi‑Fi', 'Wi‑Fi', 'ph:wifi-high-duotone', 'from-brand-500 to-brand-700', '{"amenities":["wifi"]}', 7),
  ('water', 'nature', 'У воды', 'By the water', 'ph:drop-duotone', 'from-cyan-400 to-blue-600', '{"amenities":["view_water"]}', 0),
  ('sea', 'nature', 'У моря', 'By the sea', 'ph:beach-ball-duotone', 'from-sky-300 to-blue-600', '{"amenities":["view_sea"]}', 1),
  ('mountains', 'nature', 'В горах', 'In the mountains', 'ph:mountains-duotone', 'from-violet-500 to-purple-800', '{"amenities":["view_mountain"]}', 2),
  ('forest', 'nature', 'В лесу', 'In the forest', 'ph:tree-duotone', 'from-green-600 to-emerald-900', '{"amenities":["location_forest"]}', 3)
ON CONFLICT ("item_key") DO NOTHING;
