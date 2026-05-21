import { and, eq, gt, lte, min } from 'drizzle-orm'
import type { Listing } from '#shared/types/listing'
import { listingPhotos, listingPromotions, listings } from '../db/schema'
import { getDb } from '../utils/db'
import { ensureListingsIndex, getListingsIndex } from '../utils/meili'
import { getListingGuestCapacity } from '#shared/utils/listing-extra-guests'
import { mapListing } from '../utils/listing-map'

export type MeiliListingDocument = {
  id: string
  status: 'published'
  title: string
  description: string
  city: string
  address: string
  pricePerNight: number
  maxGuests: number
  bedrooms: number
  amenities: string[]
  accommodationTypes: string[]
  latitude: number
  longitude: number
  coverPhotoUrl: string | null
  managedByTeam: boolean
  boostScore: number
  highlightScore: number
  cityPinScore: number
  _geo: { lat: number, lng: number } | null
}

const getPromotionScores = async (listingId: string) => {
  const db = getDb()
  const now = new Date()
  const rows = await db.select({ productSlug: listingPromotions.productSlug })
    .from(listingPromotions)
    .where(and(
      eq(listingPromotions.listingId, listingId),
      lte(listingPromotions.startsAt, now),
      gt(listingPromotions.endsAt, now),
    ))

  return {
    boostScore: rows.some(row => row.productSlug === 'boost') ? 1 : 0,
    highlightScore: rows.some(row => row.productSlug === 'highlight') ? 1 : 0,
    cityPinScore: rows.some(row => row.productSlug === 'city_pin') ? 1 : 0,
  }
}

const getIndexPrice = async (listing: Listing) => {
  if (listing.kind !== 'property') {
    return listing.pricePerNight
  }

  const db = getDb()
  const [row] = await db.select({ priceFrom: min(listings.pricePerNight) })
    .from(listings)
    .where(and(
      eq(listings.propertyListingId, listing.id),
      eq(listings.kind, 'unit'),
      eq(listings.status, 'published'),
    ))

  return row?.priceFrom ?? listing.pricePerNight
}

const getIndexAmenitiesAndTypes = async (listing: Listing) => {
  if (listing.kind !== 'property') {
    return {
      amenities: listing.amenities,
      accommodationTypes: listing.accommodationType ? [listing.accommodationType] : [],
    }
  }

  const db = getDb()
  const unitRows = await db.select({
    amenities: listings.amenities,
    accommodationType: listings.accommodationType,
  }).from(listings).where(and(
    eq(listings.propertyListingId, listing.id),
    eq(listings.kind, 'unit'),
    eq(listings.status, 'published'),
  ))

  const amenities = new Set<string>(listing.amenities)
  const accommodationTypes = new Set<string>()

  for (const unit of unitRows) {
    for (const slug of unit.amenities ?? []) {
      amenities.add(slug)
    }

    if (unit.accommodationType) {
      accommodationTypes.add(unit.accommodationType)
    }
  }

  return {
    amenities: [...amenities],
    accommodationTypes: [...accommodationTypes],
  }
}

const toDocument = async (
  listing: Listing,
  coverPhotoUrl: string | null,
): Promise<MeiliListingDocument> => {
  const scores = await getPromotionScores(listing.id)
  const pricePerNight = await getIndexPrice(listing)
  const { amenities, accommodationTypes } = await getIndexAmenitiesAndTypes(listing)

  return {
    id: listing.id,
    status: 'published',
    title: listing.title,
    description: listing.description,
    city: listing.city,
    address: listing.address,
    pricePerNight,
    maxGuests: getListingGuestCapacity(listing),
    bedrooms: listing.bedrooms,
    amenities,
    accommodationTypes,
    latitude: listing.latitude,
    longitude: listing.longitude,
    coverPhotoUrl,
    managedByTeam: listing.managedByTeam,
    boostScore: scores.boostScore,
    highlightScore: scores.highlightScore,
    cityPinScore: scores.cityPinScore,
    _geo: listing.latitude && listing.longitude
      ? { lat: listing.latitude, lng: listing.longitude }
      : null,
  }
}

export const meilisearchService = {
  ensureIndex: ensureListingsIndex,

  indexListing: async (listingId: string) => {
    await ensureListingsIndex()

    const db = getDb()
    const [row] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)

    if (!row || row.status !== 'published' || row.kind === 'unit') {
      return
    }

    const photos = await db.select().from(listingPhotos)
      .where(eq(listingPhotos.listingId, listingId))
      .orderBy(listingPhotos.sortOrder)

    const document = await toDocument(mapListing(row), photos[0]?.url ?? null)
    await getListingsIndex().addDocuments([document])
  },

  removeListing: async (listingId: string) => {
    await ensureListingsIndex()
    await getListingsIndex().deleteDocument(listingId)
  },

  reindexAll: async () => {
    await ensureListingsIndex()

    const db = getDb()
    const rows = await db.select().from(listings).where(eq(listings.status, 'published'))
    const documents: MeiliListingDocument[] = []

    for (const row of rows) {
      if (row.kind === 'unit') {
        continue
      }

      const photos = await db.select().from(listingPhotos)
        .where(eq(listingPhotos.listingId, row.id))
        .orderBy(listingPhotos.sortOrder)

      documents.push(await toDocument(mapListing(row), photos[0]?.url ?? null))
    }

    const index = getListingsIndex()
    await index.deleteAllDocuments()
    if (documents.length) {
      await index.addDocuments(documents)
    }

    return documents.length
  },
}
