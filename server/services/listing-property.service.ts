import type { ListingDetail, ListingUnitCard } from '#shared/types/listing'
import type { CreatePropertyListingInput } from '#shared/schemas/listing'
import { countNights } from '#shared/utils/dates'
import { calculateBookingPrice } from '#shared/utils/pricing'
import { and, asc, eq, inArray, min, sql } from 'drizzle-orm'
import { listingPhotos, listings } from '../db/schema'
import { getDb } from '../utils/db'
import { geocodeService } from './geocode.service'
import { syncListingLocation } from '../utils/geo'
import { mapListing } from '../utils/listing-map'
import { calendarService } from './calendar.service'
import { catalogService } from './catalog.service'

const mapPhoto = (row: typeof listingPhotos.$inferSelect) => ({
  id: row.id,
  url: row.url,
  sortOrder: row.sortOrder,
  mediaType: (row.mediaType === 'video' ? 'video' : 'photo') as 'photo' | 'video',
  embedUrl: row.embedUrl,
  provider: row.provider,
})

const getListingPhotos = async (listingId: string) => {
  const db = getDb()
  const rows = await db.select()
    .from(listingPhotos)
    .where(eq(listingPhotos.listingId, listingId))
    .orderBy(asc(listingPhotos.sortOrder), asc(listingPhotos.createdAt))

  return rows.map(mapPhoto)
}

const assertProperty = async (propertyId: string, hostId: string) => {
  const db = getDb()
  const [row] = await db.select().from(listings)
    .where(and(eq(listings.id, propertyId), eq(listings.hostId, hostId)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Property not found' })
  }

  if (row.kind !== 'property') {
    throw createError({ statusCode: 400, statusMessage: 'Listing is not a property complex' })
  }

  return row
}

export const listingPropertyService = {
  createProperty: async (hostId: string, input: CreatePropertyListingInput): Promise<ListingDetail> => {
    await catalogService.assertCityName(input.city)
    const coords = await geocodeService.resolve(input.city, input.address)
    const db = getDb()

    const [row] = await db.insert(listings).values({
      hostId,
      kind: 'property',
      title: input.title,
      description: input.description,
      checkInTime: input.checkInTime,
      checkOutTime: input.checkOutTime,
      pricePerNight: 0,
      city: input.city,
      address: input.address,
      latitude: coords.latitude,
      longitude: coords.longitude,
      maxGuests: 1,
      bedrooms: 0,
      status: 'draft',
    }).returning()

    await syncListingLocation(row.id, coords.latitude, coords.longitude)

    return {
      ...mapListing(row),
      photos: [],
      documents: [],
      units: [],
    }
  },

  assertProperty,

  listUnitsForProperty: async (
    propertyId: string,
    options?: { publishedOnly?: boolean, hostId?: string },
  ): Promise<ListingUnitCard[]> => {
    const db = getDb()
    const conditions = [
      eq(listings.propertyListingId, propertyId),
      eq(listings.kind, 'unit'),
    ]

    if (options?.hostId) {
      conditions.push(eq(listings.hostId, options.hostId))
    }

    if (options?.publishedOnly) {
      conditions.push(eq(listings.status, 'published'))
    }

    const rows = await db.select().from(listings)
      .where(and(...conditions))
      .orderBy(asc(listings.title))

    const cards: ListingUnitCard[] = []

    for (const row of rows) {
      const photos = await getListingPhotos(row.id)
      cards.push({
        id: row.id,
        title: row.title,
        status: row.status,
        pricePerNight: row.pricePerNight,
        maxGuests: row.maxGuests,
        bedrooms: row.bedrooms,
        coverPhoto: photos.find(photo => photo.mediaType === 'photo') ?? photos[0] ?? null,
      })
    }

    return cards
  },

  getPropertyStats: async (propertyIds: string[]) => {
    if (!propertyIds.length) {
      return {} as Record<string, { unitCount: number, priceFrom: number | null }>
    }

    const db = getDb()
    const rows = await db.select({
      propertyListingId: listings.propertyListingId,
      unitCount: sql<number>`count(*)::int`,
      priceFrom: min(listings.pricePerNight),
    })
      .from(listings)
      .where(and(
        inArray(listings.propertyListingId, propertyIds),
        eq(listings.kind, 'unit'),
        eq(listings.status, 'published'),
      ))
      .groupBy(listings.propertyListingId)

    const stats: Record<string, { unitCount: number, priceFrom: number | null }> = {}

    for (const row of rows) {
      if (!row.propertyListingId) {
        continue
      }

      stats[row.propertyListingId] = {
        unitCount: row.unitCount,
        priceFrom: row.priceFrom,
      }
    }

    return stats
  },

  attachListings: async (propertyId: string, hostId: string, listingIds: string[]) => {
    await assertProperty(propertyId, hostId)
    const db = getDb()

    const rows = await db.select().from(listings).where(and(
      inArray(listings.id, listingIds),
      eq(listings.hostId, hostId),
      eq(listings.kind, 'standalone'),
    ))

    if (rows.length !== listingIds.length) {
      throw createError({ statusCode: 400, statusMessage: 'Some listings cannot be attached' })
    }

    const property = await assertProperty(propertyId, hostId)

    for (const row of rows) {
      await db.update(listings).set({
        kind: 'unit',
        propertyListingId: propertyId,
        city: property.city,
        address: property.address,
        latitude: property.latitude,
        longitude: property.longitude,
        updatedAt: new Date(),
      }).where(eq(listings.id, row.id))
    }

    return listingPropertyService.listUnitsForProperty(propertyId, { hostId })
  },

  getUnitOffers: async (
    propertyId: string,
    options: { checkIn?: string, checkOut?: string, guests?: number },
  ) => {
    const units = await listingPropertyService.listUnitsForProperty(propertyId, { publishedOnly: true })

    const nights = options.checkIn && options.checkOut
      ? countNights(options.checkIn, options.checkOut)
      : 0

    const offers = []

    for (const unit of units) {
      let available = true

      if (options.checkIn && options.checkOut) {
        try {
          await calendarService.assertRangeAvailable(unit.id, options.checkIn, options.checkOut)
        } catch {
          available = false
        }
      }

      if (options.guests && unit.maxGuests < options.guests) {
        available = false
      }

      const pricing = nights > 0
        ? calculateBookingPrice(nights, unit.pricePerNight, { guests: options.guests ?? 2, maxGuestsIncluded: unit.maxGuests })
        : null

      offers.push({
        ...unit,
        available,
        nights: nights || null,
        totalPrice: pricing?.total ?? null,
      })
    }

    return offers
  },

  attachPropertyMeta: async <T extends { id: string, kind: string }>(items: T[]) => {
    const propertyIds = items
      .filter(item => item.kind === 'property')
      .map(item => item.id)

    const stats = await listingPropertyService.getPropertyStats(propertyIds)

    return items.map(item => {
      if (item.kind !== 'property') {
        return item
      }

      const meta = stats[item.id]
      return {
        ...item,
        unitCount: meta?.unitCount ?? 0,
        priceFrom: meta?.priceFrom ?? null,
      }
    })
  },
}
