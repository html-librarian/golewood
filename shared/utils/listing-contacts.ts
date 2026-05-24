import type { ListingContacts } from '#shared/types/listing-contacts'
import { normalizeExternalUrl, normalizeInstagramInput } from '#shared/utils/spotlight-listing-link'

const trimOrNull = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim()

  return trimmed ? trimmed : null
}

export const normalizePhoneInput = (input: string): string | null => {
  const trimmed = input.trim()

  if (!trimmed) {
    return null
  }

  return trimmed.replace(/\s{2,}/g, ' ')
}

export const normalizeTelegramInput = (input: string): string | null => {
  const trimmed = input.trim()

  if (!trimmed) {
    return null
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('t.me/')) {
    return normalizeExternalUrl(trimmed)
  }

  const handle = trimmed.replace(/^@/, '').replace(/\s+/g, '')

  if (!handle) {
    return null
  }

  return `https://t.me/${handle}`
}

export const normalizeWhatsAppInput = (input: string): string | null => {
  const trimmed = input.trim()

  if (!trimmed) {
    return null
  }

  if (/wa\.me|whatsapp\.com/i.test(trimmed)) {
    return normalizeExternalUrl(trimmed)
  }

  const digits = trimmed.replace(/\D/g, '')

  if (digits.length < 10) {
    return null
  }

  return `https://wa.me/${digits}`
}

export const normalizeVkInput = (input: string): string | null => {
  const trimmed = input.trim()

  if (!trimmed) {
    return null
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('vk.com/')) {
    return normalizeExternalUrl(trimmed)
  }

  const id = trimmed.replace(/^@/, '').replace(/\s+/g, '')

  if (!id) {
    return null
  }

  return `https://vk.com/${id}`
}

export const normalizeMaxInput = (input: string): string | null => {
  const trimmed = input.trim()

  if (!trimmed) {
    return null
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('max.ru')) {
    return normalizeExternalUrl(trimmed)
  }

  const handle = trimmed.replace(/^@/, '').replace(/\s+/g, '')

  if (!handle) {
    return null
  }

  return `https://max.ru/u/${handle}`
}

export const normalizeListingContacts = (input: ListingContacts | null | undefined): ListingContacts => ({
  phone: input?.phone ? normalizePhoneInput(input.phone) : null,
  website: input?.website ? normalizeExternalUrl(input.website) : null,
  telegram: input?.telegram ? normalizeTelegramInput(input.telegram) : null,
  whatsapp: input?.whatsapp ? normalizeWhatsAppInput(input.whatsapp) : null,
  max: input?.max ? normalizeMaxInput(input.max) : null,
  vk: input?.vk ? normalizeVkInput(input.vk) : null,
  instagram: input?.instagram ? normalizeInstagramInput(input.instagram) : null,
})

export const hasListingContacts = (contacts: ListingContacts | null | undefined): boolean =>
  Object.values(normalizeListingContacts(contacts)).some(Boolean)

export const listingContactsToForm = (contacts: ListingContacts | null | undefined): Record<keyof ListingContacts, string> => ({
  phone: contacts?.phone ?? '',
  website: contacts?.website ?? '',
  telegram: contacts?.telegram ?? '',
  whatsapp: contacts?.whatsapp ?? '',
  max: contacts?.max ?? '',
  vk: contacts?.vk ?? '',
  instagram: contacts?.instagram ?? '',
})

export const listingContactsFromForm = (form: Record<keyof ListingContacts, string>): ListingContacts =>
  normalizeListingContacts({
    phone: trimOrNull(form.phone),
    website: trimOrNull(form.website),
    telegram: trimOrNull(form.telegram),
    whatsapp: trimOrNull(form.whatsapp),
    max: trimOrNull(form.max),
    vk: trimOrNull(form.vk),
    instagram: trimOrNull(form.instagram),
  })
