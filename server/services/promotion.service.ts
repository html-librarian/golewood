import type { ListingPromotion, ListingPromotionMeta, PromotionProductSlug } from '#shared/types/promotion'
import type { PurchasePromotionInput } from '#shared/schemas/promotion'
import { PROMOTION_PRODUCTS } from '#shared/constants/promotions'
import { and, eq, gt, inArray, lte } from 'drizzle-orm'
import { hostLegalProfiles, hostPromoTransactions, listingPromotions, listings, users } from '../db/schema'
import { getDb } from '../utils/db'
import { hostPromoService } from './host-promo.service'
import { meilisearchService } from './meilisearch.service'

const mapPromotion = (row: typeof listingPromotions.$inferSelect): ListingPromotion => ({
  id: row.id,
  listingId: row.listingId,
  hostId: row.hostId,
  productSlug: row.productSlug as PromotionProductSlug,
  pricePoints: row.pricePoints,
  startsAt: row.startsAt.toISOString(),
  endsAt: row.endsAt.toISOString(),
  createdAt: row.createdAt.toISOString(),
})

const getProduct = (slug: PromotionProductSlug) => {
  const product = PROMOTION_PRODUCTS.find(item => item.slug === slug)

  if (!product) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown promotion product' })
  }

  return product
}

const assertHostOwnership = async (listingId: string, hostId: string) => {
  const db = getDb()
  const [row] = await db.select({
    id: listings.id,
    hostId: listings.hostId,
    status: listings.status,
    title: listings.title,
  })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
  }

  if (row.hostId !== hostId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  if (row.status !== 'published') {
    throw createError({ statusCode: 400, statusMessage: 'Only published listings can be promoted' })
  }

  return row
}

const buildActiveMeta = (rows: typeof listingPromotions.$inferSelect[]): ListingPromotionMeta => {
  const now = Date.now()
  const active = rows.filter(row => row.startsAt.getTime() <= now && row.endsAt.getTime() > now)

  return {
    highlight: active.some(row => row.productSlug === 'highlight'),
    boost: active.some(row => row.productSlug === 'boost'),
    cityPin: active.some(row => row.productSlug === 'city_pin'),
  }
}

export const promotionService = {
  getActiveForListing: async (listingId: string) => {
    const db = getDb()
    const now = new Date()
    const rows = await db.select().from(listingPromotions)
      .where(and(
        eq(listingPromotions.listingId, listingId),
        lte(listingPromotions.startsAt, now),
        gt(listingPromotions.endsAt, now),
      ))

    return {
      promotions: rows.map(mapPromotion),
      meta: buildActiveMeta(rows),
    }
  },

  listForHostListing: async (listingId: string, hostId: string) => {
    await assertHostOwnership(listingId, hostId)
    const db = getDb()
    const rows = await db.select().from(listingPromotions)
      .where(eq(listingPromotions.listingId, listingId))
      .orderBy(listingPromotions.endsAt)

    const now = new Date()
    const active = rows.filter(row => row.startsAt <= now && row.endsAt > now)

    return {
      active: active.map(mapPromotion),
      history: rows.map(mapPromotion),
      products: PROMOTION_PRODUCTS,
      balance: await hostPromoService.getBalance(hostId),
    }
  },

  purchase: async (listingId: string, hostId: string, input: PurchasePromotionInput) => {
    const listing = await assertHostOwnership(listingId, hostId)
    const product = getProduct(input.productSlug)
    const db = getDb()
    const now = new Date()

    const [existing] = await db.select({ id: listingPromotions.id }).from(listingPromotions)
      .where(and(
        eq(listingPromotions.listingId, listingId),
        eq(listingPromotions.productSlug, product.slug),
        gt(listingPromotions.endsAt, now),
      ))
      .limit(1)

    if (existing) {
      throw createError({ statusCode: 400, statusMessage: 'Promotion already active for this listing' })
    }

    const balance = await hostPromoService.getBalance(hostId)

    if (balance < product.pricePoints) {
      throw createError({ statusCode: 400, statusMessage: 'Insufficient promo balance' })
    }

    const endsAt = new Date(now.getTime() + product.durationDays * 24 * 60 * 60 * 1000)

    return db.transaction(async (tx) => {
      const [user] = await tx.select({ hostPromoBalance: users.hostPromoBalance })
        .from(users)
        .where(eq(users.id, hostId))
        .limit(1)

      if (!user || user.hostPromoBalance < product.pricePoints) {
        throw createError({ statusCode: 400, statusMessage: 'Insufficient promo balance' })
      }

      const [promotion] = await tx.insert(listingPromotions).values({
        listingId,
        hostId,
        productSlug: product.slug,
        pricePoints: product.pricePoints,
        startsAt: now,
        endsAt,
      }).returning()

      const nextBalance = user.hostPromoBalance - product.pricePoints

      await tx.update(users)
        .set({ hostPromoBalance: nextBalance, updatedAt: new Date() })
        .where(eq(users.id, hostId))

      await tx.insert(hostPromoTransactions).values({
        userId: hostId,
        amount: -product.pricePoints,
        type: 'promotion_purchase',
        listingId,
        promotionId: promotion.id,
        balanceAfter: nextBalance,
      })

      await meilisearchService.indexListing(listingId).catch(() => undefined)

      return {
        promotion: mapPromotion(promotion),
        listingTitle: listing.title,
      }
    })
  },

  attachPromotionMeta: async <T extends { id: string }>(items: T[]) => {
    if (!items.length) {
      return []
    }

    const db = getDb()
    const now = new Date()
    const ids = items.map(item => item.id)
    const rows = await db.select().from(listingPromotions)
      .where(and(
        inArray(listingPromotions.listingId, ids),
        lte(listingPromotions.startsAt, now),
        gt(listingPromotions.endsAt, now),
      ))

    const metaByListing = new Map<string, ListingPromotionMeta>()

    for (const id of ids) {
      metaByListing.set(id, { highlight: false, boost: false, cityPin: false })
    }

    for (const row of rows) {
      const current = metaByListing.get(row.listingId) ?? { highlight: false, boost: false, cityPin: false }

      if (row.productSlug === 'highlight') {
        current.highlight = true
      }

      if (row.productSlug === 'boost') {
        current.boost = true
      }

      if (row.productSlug === 'city_pin') {
        current.cityPin = true
      }

      metaByListing.set(row.listingId, current)
    }

    return items.map(item => ({
      ...item,
      promotions: metaByListing.get(item.id) ?? { highlight: false, boost: false, cityPin: false },
    }))
  },

  syncMeiliPromotionFields: async () => {
    const db = getDb()
    const since = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    const rows = await db.select({ listingId: listingPromotions.listingId })
      .from(listingPromotions)
      .where(gt(listingPromotions.endsAt, since))

    const listingIds = [...new Set(rows.map(row => row.listingId))]
    let reindexed = 0

    for (const listingId of listingIds) {
      await meilisearchService.indexListing(listingId).catch(() => undefined)
      reindexed += 1
    }

    return { reindexed }
  },

  attachHostVerified: async <T extends { id: string }>(items: T[]) => {
    if (!items.length) {
      return items.map(item => ({ ...item, hostVerified: false }))
    }

    const db = getDb()
    const ids = items.map(item => item.id)
    const listingRows = await db.select({
      listingId: listings.id,
      hostId: listings.hostId,
    })
      .from(listings)
      .where(inArray(listings.id, ids))

    const hostIds = [...new Set(listingRows.map(row => row.hostId))]
    const verifiedByHost = new Map<string, boolean>()

    if (hostIds.length) {
      const profiles = await db.select({
        userId: hostLegalProfiles.userId,
        isVerified: hostLegalProfiles.isVerified,
        legalName: hostLegalProfiles.legalName,
      })
        .from(hostLegalProfiles)
        .where(inArray(hostLegalProfiles.userId, hostIds))

      for (const profile of profiles) {
        verifiedByHost.set(
          profile.userId,
          profile.isVerified && profile.legalName.trim().length > 0,
        )
      }
    }

    const hostByListing = new Map(listingRows.map(row => [row.listingId, row.hostId]))

    return items.map((item) => {
      const hostId = hostByListing.get(item.id)
      return {
        ...item,
        hostVerified: hostId ? (verifiedByHost.get(hostId) ?? false) : false,
      }
    })
  },
}
