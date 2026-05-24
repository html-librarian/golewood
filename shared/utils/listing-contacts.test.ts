import { describe, expect, it } from 'vitest'
import {
  hasListingContacts,
  listingContactsFromForm,
  normalizeListingContacts,
  normalizeTelegramInput,
  normalizeWhatsAppInput,
} from './listing-contacts'

describe('listing-contacts', () => {
  it('normalizes telegram handle to t.me link', () => {
    expect(normalizeTelegramInput('@glamping')).toBe('https://t.me/glamping')
  })

  it('normalizes whatsapp phone to wa.me link', () => {
    expect(normalizeWhatsAppInput('+7 900 123-45-67')).toBe('https://wa.me/79001234567')
  })

  it('strips empty fields from form', () => {
    expect(listingContactsFromForm({
      phone: '',
      website: ' site.ru ',
      telegram: '',
      whatsapp: '',
      max: '',
      vk: '',
      instagram: '',
    })).toEqual({
      phone: null,
      website: 'https://site.ru',
      telegram: null,
      whatsapp: null,
      max: null,
      vk: null,
      instagram: null,
    })
  })

  it('detects when any contact is set', () => {
    expect(hasListingContacts(normalizeListingContacts({ phone: '+7900' }))).toBe(true)
    expect(hasListingContacts({})).toBe(false)
  })
})
