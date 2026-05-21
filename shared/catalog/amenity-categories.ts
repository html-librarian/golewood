export const AMENITY_CATEGORIES = [
  'location',
  'outdoor',
  'activities',
  'kitchen',
  'kids',
  'comfort',
  'rules',
  'view',
  'bathroom',
  'extras',
] as const

export type AmenityCategory = typeof AMENITY_CATEGORIES[number]

export const AMENITY_CATEGORY_ORDER: AmenityCategory[] = [
  'location',
  'outdoor',
  'activities',
  'kitchen',
  'kids',
  'comfort',
  'rules',
  'view',
  'bathroom',
  'extras',
]

export const AMENITY_CATEGORY_LABELS: Record<AmenityCategory, { ru: string, en: string }> = {
  location: { ru: 'Расположение', en: 'Location' },
  outdoor: { ru: 'На территории', en: 'On the property' },
  activities: { ru: 'Развлечения и активности', en: 'Activities' },
  kitchen: { ru: 'Кухня', en: 'Kitchen' },
  kids: { ru: 'Для детей', en: 'For children' },
  comfort: { ru: 'В доме', en: 'Indoors' },
  rules: { ru: 'Правила размещения', en: 'House rules' },
  view: { ru: 'Вид из окна', en: 'View' },
  bathroom: { ru: 'Санузел', en: 'Bathroom' },
  extras: { ru: 'Дополнительно', en: 'Extras' },
}

export const normalizeAmenityCategory = (value: string | null | undefined): AmenityCategory =>
  AMENITY_CATEGORIES.includes(value as AmenityCategory) ? value as AmenityCategory : 'comfort'
