INSERT INTO "home_discovery_items" ("item_key", "group_id", "label_ru", "label_en", "icon", "tone", "params", "sort_order") VALUES
  ('kaliningrad', 'destinations', 'Калининград', 'Kaliningrad', 'ph:lighthouse-duotone', 'from-blue-500 to-indigo-700', '{"city":"Калининград"}', 8),
  ('baikal', 'destinations', 'Байкал', 'Lake Baikal', 'ph:drop-half-bottom-duotone', 'from-cyan-500 to-blue-800', '{"city":"Иркутск"}', 9),
  ('gelendzhik', 'destinations', 'Геленджик', 'Gelendzhik', 'ph:sun-horizon-duotone', 'from-orange-400 to-rose-600', '{"city":"Геленджик"}', 10),
  ('vladivostok', 'destinations', 'Владивосток', 'Vladivostok', 'ph:anchor-duotone', 'from-indigo-400 to-blue-700', '{"city":"Владивосток"}', 11),
  ('yalta', 'destinations', 'Крым', 'Crimea', 'ph:island-duotone', 'from-teal-400 to-cyan-700', '{"city":"Ялта"}', 12),
  ('ekb', 'destinations', 'Екатеринбург', 'Yekaterinburg', 'ph:buildings-duotone', 'from-zinc-500 to-zinc-700', '{"city":"Екатеринбург"}', 13),
  ('nn', 'destinations', 'Нижний Новгород', 'Nizhny Novgorod', 'ph:bridge-duotone', 'from-red-400 to-red-700', '{"city":"Нижний Новгород"}', 14),
  ('murmansk', 'destinations', 'Мурманск', 'Murmansk', 'ph:sparkle-duotone', 'from-slate-400 to-blue-900', '{"city":"Мурманск"}', 15)
ON CONFLICT ("item_key") DO NOTHING;
