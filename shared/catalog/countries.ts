/** Справочник стран каталога (ISO 3166-1 alpha-2). active=true — доступны в UI. */
export const CATALOG_COUNTRIES = [
  { code: 'RU', nameRu: 'Россия', nameEn: 'Russia', active: true, sortOrder: 1 },
  { code: 'BY', nameRu: 'Беларусь', nameEn: 'Belarus', active: false, sortOrder: 10 },
  { code: 'KZ', nameRu: 'Казахстан', nameEn: 'Kazakhstan', active: false, sortOrder: 20 },
  { code: 'AM', nameRu: 'Армения', nameEn: 'Armenia', active: false, sortOrder: 30 },
  { code: 'GE', nameRu: 'Грузия', nameEn: 'Georgia', active: false, sortOrder: 40 },
  { code: 'AZ', nameRu: 'Азербайджан', nameEn: 'Azerbaijan', active: false, sortOrder: 50 },
  { code: 'UZ', nameRu: 'Узбекистан', nameEn: 'Uzbekistan', active: false, sortOrder: 60 },
  { code: 'KG', nameRu: 'Кыргызстан', nameEn: 'Kyrgyzstan', active: false, sortOrder: 70 },
  { code: 'TJ', nameRu: 'Таджикистан', nameEn: 'Tajikistan', active: false, sortOrder: 80 },
  { code: 'MD', nameRu: 'Молдова', nameEn: 'Moldova', active: false, sortOrder: 90 },
  { code: 'TR', nameRu: 'Турция', nameEn: 'Turkey', active: false, sortOrder: 100 },
  { code: 'AE', nameRu: 'ОАЭ', nameEn: 'United Arab Emirates', active: false, sortOrder: 110 },
  { code: 'TH', nameRu: 'Таиланд', nameEn: 'Thailand', active: false, sortOrder: 120 },
  { code: 'FI', nameRu: 'Финляндия', nameEn: 'Finland', active: false, sortOrder: 130 },
  { code: 'EE', nameRu: 'Эстония', nameEn: 'Estonia', active: false, sortOrder: 140 },
  { code: 'LV', nameRu: 'Латвия', nameEn: 'Latvia', active: false, sortOrder: 150 },
  { code: 'LT', nameRu: 'Литва', nameEn: 'Lithuania', active: false, sortOrder: 160 },
  { code: 'DE', nameRu: 'Германия', nameEn: 'Germany', active: false, sortOrder: 170 },
  { code: 'FR', nameRu: 'Франция', nameEn: 'France', active: false, sortOrder: 180 },
  { code: 'IT', nameRu: 'Италия', nameEn: 'Italy', active: false, sortOrder: 190 },
  { code: 'ES', nameRu: 'Испания', nameEn: 'Spain', active: false, sortOrder: 200 },
  { code: 'GB', nameRu: 'Великобритания', nameEn: 'United Kingdom', active: false, sortOrder: 210 },
  { code: 'US', nameRu: 'США', nameEn: 'United States', active: false, sortOrder: 220 },
  { code: 'CN', nameRu: 'Китай', nameEn: 'China', active: false, sortOrder: 230 },
] as const

export type CatalogCountryCode = (typeof CATALOG_COUNTRIES)[number]['code']

export const DEFAULT_COUNTRY_CODE: CatalogCountryCode = 'RU'
