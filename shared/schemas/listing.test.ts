import { describe, expect, it } from 'vitest'
import { createListingSchema, updateListingSchema } from './listing'

describe('listing schemas', () => {
  it('validates create payload with extra guests', () => {
    const parsed = createListingSchema.parse({
      title: 'Дом у моря',
      description: '',
      pricePerNight: 5000,
      city: 'Сочи',
      address: '',
      maxGuests: 4,
      bedrooms: 2,
      amenities: [],
      houseRules: '',
      extraGuestsOffered: true,
      maxGuestsWithExtra: 6,
      extraGuestPricePerNight: 500,
    })

    expect(parsed.maxGuestsWithExtra).toBe(6)
    expect(parsed.checkInTime).toBe('15:00')
    expect(parsed.checkOutTime).toBe('12:00')
  })

  it('rejects invalid check-in time', () => {
    expect(() => createListingSchema.parse({
      title: 'Дом',
      pricePerNight: 1000,
      city: 'Сочи',
      checkInTime: '25:00',
    })).toThrow()
  })

  it('allows partial update without refine on schema', () => {
    const parsed = updateListingSchema.parse({ title: 'Новое название' })

    expect(parsed.title).toBe('Новое название')
    expect(parsed.pricePerNight).toBeUndefined()
  })

  it('rejects invalid extra guests on create', () => {
    expect(() => createListingSchema.parse({
      title: 'Дом',
      pricePerNight: 1000,
      city: 'Сочи',
      maxGuests: 4,
      extraGuestsOffered: true,
      maxGuestsWithExtra: 4,
      extraGuestPricePerNight: 500,
    })).toThrow()
  })
})
