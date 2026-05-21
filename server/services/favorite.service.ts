import type { ListingCard, ListingMediaType } from '#shared/types/listing'
import { and, desc, eq } from 'drizzle-orm'
import { favorites, listingPhotos, listings } from '../db/schema'
import { getDb } from '../utils/db'
import { mapListing } from './listing.service'
import { reviewService } from './review.service'
import { teamBadgeService } from './team-badge.service'
import { listingNewsService } from './listing-news.service'
import { promotionService } from './promotion.service'

const toListingMediaType = (value: string): ListingMediaType =>
  value === 'video' ? 'video' : 'photo'

const getListingPhotos = async (listingId: string) => {
  const db = getDb()
  const rows = await db.select()
    .from(listingPhotos)
    .where(eq(listingPhotos.listingId, listingId))
    .orderBy(listingPhotos.sortOrder)

  return rows
}

export const favoriteService = {
  listIds: async (userId: string) => {
    const db = getDb()
    const rows = await db.select({ listingId: favorites.listingId })
      .from(favorites)
      .where(eq(favorites.userId, userId))

    return rows.map(row => row.listingId)
  },

  list: async (userId: string): Promise<ListingCard[]> => {
    const db = getDb()
    const rows = await db.select({ listing: listings })
      .from(favorites)
      .innerJoin(listings, eq(favorites.listingId, listings.id))
      .where(and(eq(favorites.userId, userId), eq(listings.status, 'published')))
      .orderBy(desc(favorites.createdAt))

    const cards: ListingCard[] = []

    for (const { listing: row } of rows) {
      const photos = await getListingPhotos(row.id)
      cards.push({
        ...mapListing(row),
        coverPhoto: photos[0] ? {
          id: photos[0].id,
          url: photos[0].url,
          sortOrder: photos[0].sortOrder,
          mediaType: toListingMediaType(photos[0].mediaType),
        } : null,
      })
    }

    const summaries = await reviewService.getSummariesForListings(cards.map(card => card.id))

    const withRatings = cards.map(card => ({
      ...card,
      averageRating: summaries[card.id]?.averageRating ?? null,
      reviewCount: summaries[card.id]?.reviewCount ?? 0,
    }))

    const withNews = await listingNewsService.attachCardMeta(
      await teamBadgeService.attachToListings(withRatings),
    )
    const withPromotions = await promotionService.attachPromotionMeta(withNews)
    return promotionService.attachHostVerified(withPromotions)
  },

  add: async (userId: string, listingId: string) => {
    const db = getDb()
    const [listing] = await db.select().from(listings)
      .where(and(eq(listings.id, listingId), eq(listings.status, 'published')))
      .limit(1)

    if (!listing) {
      throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
    }

    await db.insert(favorites)
      .values({ userId, listingId })
      .onConflictDoNothing()

    return { ok: true }
  },

  remove: async (userId: string, listingId: string) => {
    const db = getDb()
    await db.delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)))

    return { ok: true }
  },
}
