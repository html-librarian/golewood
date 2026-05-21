import type { ListingCard } from '#shared/types/listing'
import type { SearchParams, SearchResult, SearchResultItem } from '#shared/types/search'
import { partitionPromotedForSearch } from '#shared/utils/promotion'
import { and, eq, inArray, lt, gt, sql } from 'drizzle-orm'
import { bookings, listings } from '../db/schema'
import { getDb } from '../utils/db'
import { ensureListingsIndex, getListingsIndex } from '../utils/meili'
import { listingService } from './listing.service'
import { reviewService } from './review.service'
import { teamBadgeService } from './team-badge.service'
import { listingNewsService } from './listing-news.service'
import { promotionService } from './promotion.service'
import { buildMeiliFilters } from '#shared/utils/meili-filters'

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const getUnavailableListingIds = async (checkIn: string, checkOut: string) => {
  const db = getDb()
  const rows = await db.select({ listingId: bookings.listingId }).from(bookings).where(and(
    inArray(bookings.status, ['pending', 'confirmed']),
    lt(bookings.checkIn, new Date(checkOut)),
    gt(bookings.checkOut, new Date(checkIn)),
  ))

  return rows.map(row => row.listingId)
}

const filterHitsByPropertyAvailability = async (
  hits: Record<string, unknown>[],
  checkIn: string,
  checkOut: string,
) => {
  if (!hits.length) {
    return hits
  }

  const hitIds = hits.map(hit => String(hit.id))
  const db = getDb()
  const propertyRows = await db.select({ id: listings.id }).from(listings)
    .where(and(inArray(listings.id, hitIds), eq(listings.kind, 'property')))

  if (!propertyRows.length) {
    return hits
  }

  const unavailable = new Set(await getUnavailableListingIds(checkIn, checkOut))
  const excludePropertyIds = new Set<string>()

  for (const property of propertyRows) {
    const unitRows = await db.select({ id: listings.id }).from(listings).where(and(
      eq(listings.propertyListingId, property.id),
      eq(listings.kind, 'unit'),
      eq(listings.status, 'published'),
    ))

    if (!unitRows.length || !unitRows.some(unit => !unavailable.has(unit.id))) {
      excludePropertyIds.add(property.id)
    }
  }

  return hits.filter(hit => !excludePropertyIds.has(String(hit.id)))
}

const filterByPostgisRadius = async (ids: string[], lat: number, lng: number, radiusKm: number) => {
  if (!ids.length) {
    return ids
  }

  const db = getDb()
  const radiusMeters = radiusKm * 1000

  const rows = await db.execute<{ id: string }>(sql`
    SELECT id
    FROM listings
    WHERE id IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})
      AND (
        (location IS NOT NULL AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        ))
        OR (location IS NULL AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        ))
      )
  `)

  return rows.map(row => row.id)
}

const filterHitsToPublished = async (hits: Record<string, unknown>[]) => {
  if (!hits.length) {
    return hits
  }

  const ids = hits.map(hit => String(hit.id))
  const db = getDb()
  const rows = await db.select({ id: listings.id }).from(listings).where(and(
    inArray(listings.id, ids),
    eq(listings.status, 'published'),
  ))
  const allowed = new Set(rows.map(row => row.id))

  return hits.filter(hit => allowed.has(String(hit.id)))
}

const toSearchItem = (hit: Record<string, unknown>, distance?: number): SearchResultItem => ({
  id: String(hit.id),
  title: String(hit.title),
  city: String(hit.city),
  address: String(hit.address ?? ''),
  pricePerNight: Number(hit.pricePerNight),
  maxGuests: Number(hit.maxGuests),
  bedrooms: Number(hit.bedrooms),
  amenities: Array.isArray(hit.amenities) ? hit.amenities.map(String) : [],
  latitude: Number(hit.latitude),
  longitude: Number(hit.longitude),
  coverPhoto: hit.coverPhotoUrl
    ? { id: String(hit.id), url: String(hit.coverPhotoUrl), sortOrder: 0 }
    : null,
  distance,
  managedByTeam: Boolean(hit.managedByTeam),
})

const cardToSearchItem = (card: ListingCard, distance?: number): SearchResultItem => ({
  id: card.id,
  title: card.title,
  city: card.city,
  address: card.address,
  pricePerNight: card.pricePerNight,
  maxGuests: card.maxGuests,
  bedrooms: card.bedrooms,
  amenities: card.amenities,
  latitude: card.latitude,
  longitude: card.longitude,
  coverPhoto: card.coverPhoto,
  distance,
  managedByTeam: card.managedByTeam,
})

const filterListingCards = (cards: ListingCard[], params: SearchParams) => {
  let filtered = cards

  if (params.q?.trim()) {
    const q = params.q.trim().toLowerCase()
    filtered = filtered.filter(card =>
      card.title.toLowerCase().includes(q)
      || card.description.toLowerCase().includes(q)
      || card.city.toLowerCase().includes(q)
      || card.address.toLowerCase().includes(q),
    )
  }

  if (params.minPrice !== undefined) {
    filtered = filtered.filter(card => card.pricePerNight >= params.minPrice!)
  }

  if (params.maxPrice !== undefined) {
    filtered = filtered.filter(card => card.pricePerNight <= params.maxPrice!)
  }

  if (params.guests !== undefined) {
    filtered = filtered.filter(card => card.maxGuests >= params.guests!)
  }

  for (const amenity of params.amenities ?? []) {
    filtered = filtered.filter(card => card.amenities.includes(amenity))
  }

  if (params.teamCatalog) {
    filtered = filtered.filter(card => card.managedByTeam)
  }

  return filtered
}

const finalizeSearchItems = async (items: SearchResultItem[], params: SearchParams): Promise<SearchResult> => {
  const sortedItems = [...items]

  if (params.sort === 'distance' && params.lat !== undefined && params.lng !== undefined) {
    sortedItems.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
  }

  if (params.sort === 'price_asc') {
    sortedItems.sort((a, b) => a.pricePerNight - b.pricePerNight)
  }

  if (params.sort === 'price_desc') {
    sortedItems.sort((a, b) => b.pricePerNight - a.pricePerNight)
  }

  const summaries = await reviewService.getSummariesForListings(sortedItems.map(item => item.id))

  const itemsWithRatings = sortedItems.map(item => ({
    ...item,
    averageRating: summaries[item.id]?.averageRating ?? null,
    reviewCount: summaries[item.id]?.reviewCount ?? 0,
  }))

  let itemsWithBadges = await listingNewsService.attachCardMeta(
    await teamBadgeService.attachToListings(itemsWithRatings),
  )

  if (params.teamBadgeSlugs?.length) {
    const allowed = new Set(params.teamBadgeSlugs)
    itemsWithBadges = itemsWithBadges.filter(
      item => item.teamBadge && allowed.has(item.teamBadge.slug),
    )
  }

  const withPromotions = await promotionService.attachPromotionMeta(itemsWithBadges)
  const withVerified = await promotionService.attachHostVerified(withPromotions)
  const sorted = partitionPromotedForSearch(withVerified, params.city)
  const total = sorted.length
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 12
  const offset = (page - 1) * pageSize

  return {
    items: sorted.slice(offset, offset + pageSize),
    total,
    page,
    pageSize,
  }
}

const searchFromMeili = async (params: SearchParams): Promise<SearchResultItem[]> => {
  const index = getListingsIndex()
  const filters = buildMeiliFilters(params)

  const sort = params.sort === 'price_asc'
    ? ['pricePerNight:asc']
    : params.sort === 'price_desc'
      ? ['pricePerNight:desc']
      : !params.sort
        ? ['cityPinScore:desc', 'boostScore:desc']
        : undefined

  const meiliResult = await index.search(params.q ?? '', {
    filter: filters.length ? filters : undefined,
    sort,
    limit: 200,
  })

  let hits = await filterHitsToPublished(meiliResult.hits as Record<string, unknown>[])

  if (params.checkIn && params.checkOut) {
    const unavailable = await getUnavailableListingIds(params.checkIn, params.checkOut)
    if (unavailable.length) {
      hits = hits.filter(hit => !unavailable.includes(String(hit.id)))
    }

    hits = await filterHitsByPropertyAvailability(hits, params.checkIn, params.checkOut)
  }

  if (params.lat !== undefined && params.lng !== undefined && params.radius !== undefined) {
    const ids = hits.map(hit => String(hit.id))
    const inRadius = await filterByPostgisRadius(ids, params.lat, params.lng, params.radius)
    hits = hits.filter(hit => inRadius.includes(String(hit.id)))
  }

  return hits.map((hit) => {
    const lat = Number(hit.latitude)
    const lng = Number(hit.longitude)
    const distance = params.lat !== undefined && params.lng !== undefined
      ? haversineKm(params.lat, params.lng, lat, lng)
      : undefined

    return toSearchItem(hit, distance)
  })
}

const searchFromDatabase = async (params: SearchParams): Promise<SearchResultItem[]> => {
  const cards = filterListingCards(await listingService.listPublished(params.city), params)
  let listingIds = cards.map(card => card.id)

  if (params.checkIn && params.checkOut) {
    const unavailable = await getUnavailableListingIds(params.checkIn, params.checkOut)
    if (unavailable.length) {
      listingIds = listingIds.filter(id => !unavailable.includes(id))
    }

    const db = getDb()
    const propertyRows = await db.select({ id: listings.id }).from(listings)
      .where(and(inArray(listings.id, listingIds), eq(listings.kind, 'property')))

    for (const property of propertyRows) {
      const unitRows = await db.select({ id: listings.id }).from(listings).where(and(
        eq(listings.propertyListingId, property.id),
        eq(listings.kind, 'unit'),
        eq(listings.status, 'published'),
      ))

      if (!unitRows.length || !unitRows.some(unit => !unavailable.includes(unit.id))) {
        listingIds = listingIds.filter(id => id !== property.id)
      }
    }
  }

  if (params.lat !== undefined && params.lng !== undefined && params.radius !== undefined) {
    listingIds = await filterByPostgisRadius(listingIds, params.lat, params.lng, params.radius)
  }

  const allowed = new Set(listingIds)

  return cards
    .filter(card => allowed.has(card.id))
    .map((card) => {
      const distance = params.lat !== undefined && params.lng !== undefined
        ? haversineKm(params.lat, params.lng, card.latitude, card.longitude)
        : undefined

      return cardToSearchItem(card, distance)
    })
}

const loadSearchItems = async (params: SearchParams): Promise<SearchResultItem[]> => {
  try {
    return await searchFromMeili(params)
  } catch {
    try {
      await ensureListingsIndex()
      return await searchFromMeili(params)
    } catch {
      return searchFromDatabase(params)
    }
  }
}

export const searchService = {
  search: async (params: SearchParams): Promise<SearchResult> => {
    const items = await loadSearchItems(params)
    return finalizeSearchItems(items, params)
  },
}
