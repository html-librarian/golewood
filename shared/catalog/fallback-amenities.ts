import type { AmenityCatalogItem } from '#shared/types/catalog'

/** Used when amenity_catalog table is missing (migration not applied). */
export const FALLBACK_AMENITY_CATALOG: AmenityCatalogItem[] = [
  { id: 'fb-wifi', slug: 'wifi', icon: 'ph:wifi-high-duotone', labelRu: 'Wi‑Fi', labelEn: 'Wi‑Fi', category: 'comfort', active: true, sortOrder: 1 },
  { id: 'fb-parking', slug: 'parking', icon: 'ph:car-duotone', labelRu: 'Парковка', labelEn: 'Parking', category: 'outdoor', active: true, sortOrder: 2 },
  { id: 'fb-kitchen', slug: 'kitchen', icon: 'ph:cooking-pot-duotone', labelRu: 'Кухня', labelEn: 'Kitchen', category: 'comfort', active: true, sortOrder: 3 },
  { id: 'fb-washer', slug: 'washer', icon: 'ph:washing-machine-duotone', labelRu: 'Стиральная машина', labelEn: 'Washer', category: 'comfort', active: true, sortOrder: 4 },
  { id: 'fb-tv', slug: 'tv', icon: 'ph:television-duotone', labelRu: 'Телевизор', labelEn: 'TV', category: 'comfort', active: true, sortOrder: 5 },
  { id: 'fb-ac', slug: 'air_conditioning', icon: 'ph:snowflake-duotone', labelRu: 'Кондиционер', labelEn: 'Air conditioning', category: 'comfort', active: true, sortOrder: 6 },
  { id: 'fb-pets', slug: 'pets_allowed', icon: 'ph:dog-duotone', labelRu: 'Можно с животными', labelEn: 'Pets allowed', category: 'comfort', active: true, sortOrder: 7 },
  { id: 'fb-children', slug: 'children_allowed', icon: 'ph:baby-duotone', labelRu: 'Подходит для детей', labelEn: 'Children allowed', category: 'comfort', active: true, sortOrder: 8 },
  { id: 'fb-sauna', slug: 'sauna', icon: 'ph:thermometer-hot-duotone', labelRu: 'Баня', labelEn: 'Sauna', category: 'outdoor', active: true, sortOrder: 10 },
  { id: 'fb-hot-tub', slug: 'hot_tub', icon: 'ph:bathtub-duotone', labelRu: 'Чан / купель', labelEn: 'Hot tub', category: 'outdoor', active: true, sortOrder: 11 },
  { id: 'fb-pool', slug: 'pool', icon: 'ph:waves-duotone', labelRu: 'Бассейн', labelEn: 'Swimming pool', category: 'outdoor', active: true, sortOrder: 12 },
  { id: 'fb-grill', slug: 'grill', icon: 'ph:fire-simple-duotone', labelRu: 'Мангал', labelEn: 'Grill / BBQ', category: 'outdoor', active: true, sortOrder: 13 },
  { id: 'fb-playground', slug: 'playground', icon: 'ph:park-duotone', labelRu: 'Детская площадка', labelEn: 'Playground', category: 'outdoor', active: true, sortOrder: 14 },
  { id: 'fb-gazebo', slug: 'gazebo', icon: 'ph:house-line-duotone', labelRu: 'Беседка', labelEn: 'Gazebo', category: 'outdoor', active: true, sortOrder: 15 },
  { id: 'fb-respond', slug: 'respond_fast', icon: 'ph:chat-circle-duotone', labelRu: 'Быстро отвечают', labelEn: 'Fast responses', category: 'extras', active: true, sortOrder: 60 },
  { id: 'fb-transfer', slug: 'transfer', icon: 'ph:car-profile-duotone', labelRu: 'Трансфер', labelEn: 'Transfer', category: 'extras', active: true, sortOrder: 61 },
  { id: 'fb-early', slug: 'early_checkin', icon: 'ph:sun-horizon-duotone', labelRu: 'Ранний заезд', labelEn: 'Early check-in', category: 'extras', active: true, sortOrder: 62 },
  { id: 'fb-late', slug: 'late_checkout', icon: 'ph:moon-duotone', labelRu: 'Поздний отъезд', labelEn: 'Late check-out', category: 'extras', active: true, sortOrder: 63 },
]
