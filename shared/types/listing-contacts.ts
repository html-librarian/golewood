/** Публичные контакты объекта (сайт, мессенджеры, телефон). */
export interface ListingContacts {
  phone?: string | null
  website?: string | null
  telegram?: string | null
  whatsapp?: string | null
  max?: string | null
  vk?: string | null
  instagram?: string | null
}

export const LISTING_CONTACT_KEYS = [
  'phone',
  'website',
  'telegram',
  'whatsapp',
  'max',
  'vk',
  'instagram',
] as const satisfies readonly (keyof ListingContacts)[]
