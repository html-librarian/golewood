import { describe, expect, it } from 'vitest'
import { mapListing } from './listing-map'

describe('mapListing', () => {
  it('maps drizzle row to Listing DTO', () => {
    const createdAt = new Date('2026-01-15T10:00:00Z')
    const updatedAt = new Date('2026-02-01T12:00:00Z')

    const listing = mapListing({
      id: '550e8400-e29b-41d4-a716-446655440000',
      hostId: '660e8400-e29b-41d4-a716-446655440001',
      title: 'Дом у моря',
      metaTitle: null,
      metaDescription: null,
      description: 'Описание',
      status: 'published',
      pricePerNight: 5000,
      city: 'Сочи',
      address: 'ул. Морская, 1',
      latitude: 43.6,
      longitude: 39.7,
      maxGuests: 4,
      extraGuestsOffered: true,
      maxGuestsWithExtra: 6,
      extraGuestPricePerNight: 800,
      bedrooms: 2,
      amenities: ['wifi'],
      accommodationType: null,
      contacts: { phone: '+79001234567' },
      houseRules: 'Без курения',
      checkInTime: '15:00',
      checkOutTime: '12:00',
      kind: 'standalone',
      propertyListingId: null,
      minNights: 2,
      cancellationPolicy: 'moderate',
      cleaningFee: 0,
      transferOffered: false,
      transferPrice: null,
      transferPriceOnRequest: false,
      teamBadgeId: null,
      teamBadgeBlogPostId: null,
      managedByTeam: false,
      sourceAttributionRu: null,
      sourceAttributionEn: null,
      calendarExportToken: '770e8400-e29b-41d4-a716-446655440002',
      location: null,
      createdAt,
      updatedAt,
    })

    expect(listing.id).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(listing.status).toBe('published')
    expect(listing.extraGuestsOffered).toBe(true)
    expect(listing.maxGuestsWithExtra).toBe(6)
    expect(listing.checkInTime).toBe('15:00')
    expect(listing.checkOutTime).toBe('12:00')
    expect(listing.contacts.phone).toBe('+79001234567')
    expect(listing.createdAt).toBe(createdAt.toISOString())
  })
})
