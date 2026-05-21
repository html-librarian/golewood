ALTER TABLE "amenity_catalog" ADD COLUMN IF NOT EXISTS "category" varchar(32) NOT NULL DEFAULT 'comfort';

UPDATE "amenity_catalog" SET "category" = 'outdoor' WHERE "slug" = 'parking';

INSERT INTO "amenity_catalog" ("slug", "icon", "label_ru", "label_en", "category", "sort_order") VALUES
  ('sauna', 'ph:thermometer-hot-duotone', 'Баня', 'Sauna', 'outdoor', 10),
  ('hot_tub', 'ph:bathtub-duotone', 'Чан / купель', 'Hot tub', 'outdoor', 11),
  ('pool', 'ph:waves-duotone', 'Бассейн', 'Swimming pool', 'outdoor', 12),
  ('grill', 'ph:fire-simple-duotone', 'Мангал', 'Grill / BBQ', 'outdoor', 13),
  ('playground', 'ph:park-duotone', 'Детская площадка', 'Playground', 'outdoor', 14),
  ('gazebo', 'ph:house-line-duotone', 'Беседка', 'Gazebo', 'outdoor', 15),
  ('fridge', 'ph:package-duotone', 'Холодильник', 'Fridge', 'comfort', 20),
  ('balcony', 'ph:sun-duotone', 'Балкон, лоджия', 'Balcony', 'comfort', 21),
  ('crib', 'ph:baby-duotone', 'Детская кроватка', 'Crib', 'comfort', 22),
  ('smoking_allowed', 'ph:cigarette-duotone', 'Курение разрешено', 'Smoking allowed', 'rules', 30),
  ('parties_allowed', 'ph:confetti-duotone', 'Вечеринки разрешены', 'Parties allowed', 'rules', 31),
  ('no_deposit', 'ph:hand-coins-duotone', 'Заселение без депозита', 'No deposit', 'rules', 32),
  ('view_sea', 'ph:beach-ball-duotone', 'Вид на море', 'Sea view', 'view', 40),
  ('view_mountain', 'ph:mountains-duotone', 'Вид на горы', 'Mountain view', 'view', 41),
  ('view_water', 'ph:drop-duotone', 'Вид на реку, озеро', 'River / lake view', 'view', 42),
  ('view_city', 'ph:buildings-duotone', 'Вид на город', 'City view', 'view', 43),
  ('private_bathroom', 'ph:bathtub-duotone', 'Своя ванная', 'Private bathroom', 'bathroom', 50),
  ('private_toilet', 'ph:toilet-duotone', 'Свой туалет', 'Private toilet', 'bathroom', 51),
  ('private_shower', 'ph:shower-duotone', 'Свой душ', 'Private shower', 'bathroom', 52),
  ('respond_fast', 'ph:chat-circle-duotone', 'Быстро отвечают', 'Fast responses', 'extras', 60),
  ('transfer', 'ph:car-profile-duotone', 'Трансфер', 'Transfer', 'extras', 61),
  ('early_checkin', 'ph:sun-horizon-duotone', 'Ранний заезд', 'Early check-in', 'extras', 62),
  ('late_checkout', 'ph:moon-duotone', 'Поздний отъезд', 'Late check-out', 'extras', 63),
  ('prepayment_full', 'ph:wallet-duotone', 'Предоплата 100%', '100% prepayment', 'extras', 64),
  ('reporting_documents', 'ph:file-text-duotone', 'Отчётные документы', 'Invoices / receipts', 'extras', 65)
ON CONFLICT ("slug") DO NOTHING;
