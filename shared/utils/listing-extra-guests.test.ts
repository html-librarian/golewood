import { describe, expect, it } from 'vitest'
import {
  countExtraGuests,
  getListingExtraGuestsValidationError,
  getListingGuestCapacity,
} from './listing-extra-guests'

describe('listing extra guests', () => {
  it('counts guests above included limit', () => {
    expect(countExtraGuests(6, 4)).toBe(2)
    expect(countExtraGuests(3, 4)).toBe(0)
  })

  it('returns extended capacity when offered', () => {
    expect(getListingGuestCapacity({
      maxGuests: 4,
      extraGuestsOffered: true,
      maxGuestsWithExtra: 6,
    })).toBe(6)

    expect(getListingGuestCapacity({
      maxGuests: 4,
      extraGuestsOffered: false,
      maxGuestsWithExtra: 6,
    })).toBe(4)
  })

  it('validates surcharge settings', () => {
    expect(getListingExtraGuestsValidationError({
      maxGuests: 4,
      extraGuestsOffered: true,
      maxGuestsWithExtra: 6,
      extraGuestPricePerNight: 500,
    })).toBeNull()

    expect(getListingExtraGuestsValidationError({
      maxGuests: 4,
      extraGuestsOffered: true,
      maxGuestsWithExtra: 4,
      extraGuestPricePerNight: 500,
    })).toBeTruthy()
  })
})
