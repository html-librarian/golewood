import { z } from 'zod'
import { normalizeListingContacts } from '#shared/utils/listing-contacts'

const optionalContactString = (max: number) =>
  z.string().trim().max(max).optional().nullable().transform(value => value || null)

export const listingContactsSchema = z.object({
  phone: optionalContactString(32),
  website: optionalContactString(512),
  telegram: optionalContactString(255),
  whatsapp: optionalContactString(255),
  max: optionalContactString(255),
  vk: optionalContactString(255),
  instagram: optionalContactString(255),
}).transform(normalizeListingContacts)

export type ListingContactsInput = z.input<typeof listingContactsSchema>
