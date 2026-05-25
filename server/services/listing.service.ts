import type { ListingCard, ListingDetail, ListingDocument, ListingPhoto } from '#shared/types/listing'
import type { CreateListingInput, UpdateListingInput } from '#shared/schemas/listing'
import { and, asc, desc, eq, ne, sql } from 'drizzle-orm'
import { listingDocuments, listingPhotos, listings, users } from '../db/schema'
import { getDb } from '../utils/db'
import { geocodeService } from './geocode.service'
import { saveListingDocument, saveListingPhoto } from '../utils/storage'
import { processListingPhoto } from '../utils/image'
import { meilisearchService } from './meilisearch.service'
import { syncListingLocation } from '../utils/geo'
import { reviewService } from './review.service'
import { catalogService } from './catalog.service'
import { teamBadgeService } from './team-badge.service'
import { hostVerificationService } from './host-verification.service'
import { listingNewsService } from './listing-news.service'
import { promotionService } from './promotion.service'
import { listingPropertyService } from './listing-property.service'
import { mapListing } from '../utils/listing-map'
import {
  getListingExtraGuestsValidationError,
  normalizeListingExtraGuests,
} from '#shared/utils/listing-extra-guests'
import { normalizeSourceAttribution } from '#shared/utils/listing-source-attribution'
import { getListingTransferValidationError, mergeTransferAmenity } from '#shared/utils/listing-transfer'
import { parseVideoEmbedUrl } from '#shared/utils/video-embed'
import { LISTING_DOCUMENT_MAX_BYTES, LISTING_DOCUMENT_MAX_COUNT, LISTING_PHOTO_MAX_COUNT } from '#shared/utils/media-limits'

export { mapListing } from '../utils/listing-map'

const ensureListingTransfer = (input: Parameters<typeof getListingTransferValidationError>[0]) => {
  const message = getListingTransferValidationError(input)

  if (message) {
    throw createError({ statusCode: 400, statusMessage: message })
  }
}

const ensureListingExtraGuests = (input: Parameters<typeof getListingExtraGuestsValidationError>[0]) => {
  const message = getListingExtraGuestsValidationError(input)

  if (message) {
    throw createError({ statusCode: 400, statusMessage: message })
  }
}

const mapPhoto = (row: typeof listingPhotos.$inferSelect): ListingPhoto => ({
  id: row.id,
  url: row.url,
  sortOrder: row.sortOrder,
  mediaType: (row.mediaType === 'video' ? 'video' : 'photo') as ListingPhoto['mediaType'],
  embedUrl: row.embedUrl,
  provider: row.provider,
})

const mapDocument = (row: typeof listingDocuments.$inferSelect): ListingDocument => ({
  id: row.id,
  title: row.title,
  fileUrl: row.fileUrl,
  fileName: row.fileName,
  sortOrder: row.sortOrder,
})

const attachRatings = async (cards: ListingCard[]): Promise<ListingCard[]> => {
  if (!cards.length) {
    return cards
  }

  const summaries = await reviewService.getSummariesForListings(cards.map(card => card.id))

  return cards.map(card => ({
    ...card,
    averageRating: summaries[card.id]?.averageRating ?? null,
    reviewCount: summaries[card.id]?.reviewCount ?? 0,
  }))
}

const attachPublicMeta = async (cards: ListingCard[]) => {
  const withBadges = await teamBadgeService.attachToListings(cards)
  const withRatings = await attachRatings(withBadges)
  const withNews = await listingNewsService.attachCardMeta(withRatings)
  const withPromotions = await promotionService.attachPromotionMeta(withNews)
  return promotionService.attachHostVerified(withPromotions)
}

const ensureHostRole = async (userId: string) => {
  const db = getDb()
  await db.update(users)
    .set({ role: 'host', updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.role, 'guest')))
}

const getListingPhotos = async (listingId: string) => {
  const db = getDb()
  const rows = await db.select()
    .from(listingPhotos)
    .where(eq(listingPhotos.listingId, listingId))
    .orderBy(asc(listingPhotos.sortOrder), asc(listingPhotos.createdAt))

  return rows.map(mapPhoto)
}

const getListingDocuments = async (listingId: string) => {
  const db = getDb()
  const rows = await db.select()
    .from(listingDocuments)
    .where(eq(listingDocuments.listingId, listingId))
    .orderBy(asc(listingDocuments.sortOrder), asc(listingDocuments.createdAt))

  return rows.map(mapDocument)
}

const assertHostOwnership = async (listingId: string, hostId: string) => {
  const db = getDb()
  const [row] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
  }

  if (row.hostId !== hostId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return row
}

export const listingService = {
  listPublished: async (city?: string): Promise<ListingCard[]> => {
    const db = getDb()
    const conditions = [
      eq(listings.status, 'published'),
      ne(listings.kind, 'unit'),
    ]

    if (city) {
      conditions.push(sql`lower(${listings.city}) = lower(${city})`)
    }

    const rows = await db.select().from(listings)
      .where(and(...conditions))
      .orderBy(desc(listings.createdAt))

    const cards: ListingCard[] = []

    for (const row of rows) {
      const photos = await getListingPhotos(row.id)
      cards.push({
        ...mapListing(row),
        coverPhoto: photos.find(photo => photo.mediaType === 'photo') ?? photos[0] ?? null,
      })
    }

    const withMeta = await listingPropertyService.attachPropertyMeta(cards)
    return attachPublicMeta(withMeta)
  },

  listPublishedByHost: async (hostId: string): Promise<ListingCard[]> => {
    const db = getDb()
    const rows = await db.select().from(listings)
      .where(and(eq(listings.hostId, hostId), eq(listings.status, 'published')))
      .orderBy(desc(listings.createdAt))

    const cards: ListingCard[] = []

    for (const row of rows) {
      const photos = await getListingPhotos(row.id)
      cards.push({
        ...mapListing(row),
        coverPhoto: photos.find(photo => photo.mediaType === 'photo') ?? photos[0] ?? null,
      })
    }

    return attachPublicMeta(cards)
  },

  listPublishedForAdmin: async (): Promise<ListingCard[]> => {
    const db = getDb()
    const rows = await db.select().from(listings)
      .where(eq(listings.status, 'published'))
      .orderBy(desc(listings.title))

    const cards: ListingCard[] = []

    for (const row of rows) {
      const photos = await getListingPhotos(row.id)
      cards.push({
        ...mapListing(row),
        coverPhoto: photos.find(photo => photo.mediaType === 'photo') ?? photos[0] ?? null,
      })
    }

    return teamBadgeService.attachToListings(cards)
  },

  getPublishedById: async (id: string): Promise<ListingDetail> => {
    const db = getDb()
    const [row] = await db.select().from(listings)
      .where(and(eq(listings.id, id), eq(listings.status, 'published')))
      .limit(1)

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
    }

    const hostVerification = row.managedByTeam
      ? null
      : await hostVerificationService.getPublicForHost(row.hostId)

    const units = row.kind === 'property'
      ? await listingPropertyService.listUnitsForProperty(row.id, { publishedOnly: true })
      : undefined

    const [detail] = await teamBadgeService.attachToListings([{
      ...mapListing(row),
      photos: await getListingPhotos(row.id),
      documents: await getListingDocuments(row.id),
      hostVerification: hostVerification ?? null,
      units,
    }])

    const [withMeta] = await listingPropertyService.attachPropertyMeta([detail as ListingDetail])

    return withMeta as ListingDetail
  },

  listByHost: async (hostId: string): Promise<ListingCard[]> => {
    const db = getDb()
    const rows = await db.select().from(listings)
      .where(eq(listings.hostId, hostId))
      .orderBy(desc(listings.updatedAt))

    const cards: ListingCard[] = []

    for (const row of rows) {
      const photos = await getListingPhotos(row.id)
      cards.push({
        ...mapListing(row),
        coverPhoto: photos.find(photo => photo.mediaType === 'photo') ?? photos[0] ?? null,
      })
    }

    return listingPropertyService.attachPropertyMeta(cards)
  },

  getByIdForHost: async (id: string, hostId: string): Promise<ListingDetail> => {
    const row = await assertHostOwnership(id, hostId)

    return {
      ...mapListing(row),
      photos: await getListingPhotos(row.id),
      documents: await getListingDocuments(row.id),
    }
  },

  create: async (hostId: string, input: CreateListingInput): Promise<ListingDetail> => {
    await ensureHostRole(hostId)
    ensureListingTransfer(input)
    ensureListingExtraGuests(input)

    let propertyParent: typeof listings.$inferSelect | null = null
    if (input.propertyListingId) {
      propertyParent = await listingPropertyService.assertProperty(input.propertyListingId, hostId)
    }

    const city = input.city || propertyParent?.city || ''
    const address = input.address || propertyParent?.address || ''

    await catalogService.assertCityName(city)
    await catalogService.validateAmenitySlugs(input.amenities)
    await catalogService.validateAccommodationType(input.accommodationType)

    const coords = propertyParent && !input.address
      ? { latitude: propertyParent.latitude, longitude: propertyParent.longitude }
      : await geocodeService.resolve(city, address)
    const db = getDb()

    const amenities = mergeTransferAmenity(input.amenities, input.transferOffered)
    const extraGuests = normalizeListingExtraGuests(input)

    const [row] = await db.insert(listings).values({
      hostId,
      kind: input.propertyListingId ? 'unit' : 'standalone',
      propertyListingId: input.propertyListingId ?? null,
      title: input.title,
      metaTitle: input.metaTitle?.trim() || null,
      metaDescription: input.metaDescription?.trim() || null,
      description: input.description,
      pricePerNight: input.pricePerNight,
      city,
      address,
      latitude: coords.latitude,
      longitude: coords.longitude,
      maxGuests: input.maxGuests,
      ...extraGuests,
      bedrooms: input.bedrooms,
      amenities,
      accommodationType: input.accommodationType ?? null,
      houseRules: input.houseRules,
      checkInTime: input.checkInTime,
      checkOutTime: input.checkOutTime,
      cleaningFee: 0,
      cancellationPolicy: input.cancellationPolicy,
      transferOffered: input.transferOffered,
      transferPrice: input.transferOffered && !input.transferPriceOnRequest
        ? (input.transferPrice ?? null)
        : null,
      transferPriceOnRequest: input.transferOffered && input.transferPriceOnRequest,
      contacts: input.contacts ?? {},
      sourceAttributionRu: normalizeSourceAttribution(input.sourceAttributionRu),
      sourceAttributionEn: normalizeSourceAttribution(input.sourceAttributionEn),
      status: 'draft',
    }).returning()

    await syncListingLocation(row.id, coords.latitude, coords.longitude)

    return {
      ...mapListing(row),
      photos: [],
      documents: [],
    }
  },

  update: async (id: string, hostId: string, input: UpdateListingInput): Promise<ListingDetail> => {
    const existing = await assertHostOwnership(id, hostId)

    const maxGuests = input.maxGuests ?? existing.maxGuests

    ensureListingTransfer({
      transferOffered: input.transferOffered ?? existing.transferOffered,
      transferPrice: input.transferPrice !== undefined ? input.transferPrice : existing.transferPrice,
      transferPriceOnRequest: input.transferPriceOnRequest ?? existing.transferPriceOnRequest,
    })

    ensureListingExtraGuests({
      maxGuests,
      extraGuestsOffered: input.extraGuestsOffered ?? existing.extraGuestsOffered,
      maxGuestsWithExtra: input.maxGuestsWithExtra !== undefined
        ? input.maxGuestsWithExtra
        : existing.maxGuestsWithExtra,
      extraGuestPricePerNight: input.extraGuestPricePerNight !== undefined
        ? input.extraGuestPricePerNight
        : existing.extraGuestPricePerNight,
    })

    if (existing.status === 'archived') {
      throw createError({ statusCode: 400, statusMessage: 'Archived listings cannot be edited' })
    }

    if (input.city) {
      await catalogService.assertCityName(input.city)
    }

    if (input.amenities) {
      await catalogService.validateAmenitySlugs(input.amenities)
    }

    if (input.accommodationType !== undefined) {
      await catalogService.validateAccommodationType(input.accommodationType)
    }

    const city = input.city ?? existing.city
    const address = input.address ?? existing.address
    const cityChanged = input.city !== undefined && input.city !== existing.city
    const addressChanged = input.address !== undefined && input.address !== existing.address
    const coords = (cityChanged || addressChanged)
      ? await geocodeService.resolve(city, address)
      : { latitude: existing.latitude, longitude: existing.longitude }

    const db = getDb()
    const { cleaningFee: _removed, ...patch } = input

    const transferOffered = patch.transferOffered ?? existing.transferOffered
    const transferPriceOnRequest = patch.transferPriceOnRequest ?? existing.transferPriceOnRequest
    const extraGuestsOffered = patch.extraGuestsOffered ?? existing.extraGuestsOffered
    const amenities = patch.amenities
      ? mergeTransferAmenity(patch.amenities, transferOffered)
      : undefined
    const extraGuests = patch.extraGuestsOffered !== undefined
      || patch.maxGuestsWithExtra !== undefined
      || patch.extraGuestPricePerNight !== undefined
      ? normalizeListingExtraGuests({
          extraGuestsOffered,
          maxGuestsWithExtra: patch.maxGuestsWithExtra !== undefined
            ? patch.maxGuestsWithExtra
            : existing.maxGuestsWithExtra,
          extraGuestPricePerNight: patch.extraGuestPricePerNight !== undefined
            ? patch.extraGuestPricePerNight
            : existing.extraGuestPricePerNight,
        })
      : null

    const [row] = await db.update(listings).set({
      ...patch,
      ...(patch.sourceAttributionRu !== undefined
        ? { sourceAttributionRu: normalizeSourceAttribution(patch.sourceAttributionRu) }
        : {}),
      ...(patch.sourceAttributionEn !== undefined
        ? { sourceAttributionEn: normalizeSourceAttribution(patch.sourceAttributionEn) }
        : {}),
      ...(amenities ? { amenities } : {}),
      ...(extraGuests ?? {}),
      ...(patch.transferOffered !== undefined || patch.transferPrice !== undefined || patch.transferPriceOnRequest !== undefined
        ? {
            transferPrice: transferOffered && !transferPriceOnRequest
              ? (patch.transferPrice ?? existing.transferPrice)
              : null,
            transferPriceOnRequest: transferOffered && transferPriceOnRequest,
          }
        : {}),
      latitude: coords.latitude,
      longitude: coords.longitude,
      updatedAt: new Date(),
    }).where(eq(listings.id, id)).returning()

    await syncListingLocation(row.id, coords.latitude, coords.longitude)

    const result = {
      ...mapListing(row),
      photos: await getListingPhotos(id),
      documents: await getListingDocuments(id),
    }

    if (existing.status === 'published') {
      await meilisearchService.indexListing(id).catch(() => undefined)
    }

    return result
  },

  archive: async (id: string, hostId: string) => {
    const existing = await assertHostOwnership(id, hostId)
    const db = getDb()

    await db.update(listings)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(listings.id, id))

    if (existing.status === 'published') {
      await meilisearchService.removeListing(id).catch(() => undefined)
    }
  },

  restore: async (id: string, hostId: string) => {
    const existing = await assertHostOwnership(id, hostId)

    if (existing.status !== 'archived') {
      throw createError({ statusCode: 400, statusMessage: 'Only archived listings can be restored' })
    }

    const db = getDb()

    await db.update(listings)
      .set({ status: 'draft', updatedAt: new Date() })
      .where(eq(listings.id, id))
  },

  submitForModeration: async (id: string, hostId: string): Promise<ListingDetail> => {
    const existing = await assertHostOwnership(id, hostId)

    if (!['draft', 'published'].includes(existing.status)) {
      throw createError({ statusCode: 400, statusMessage: 'Listing cannot be submitted in current status' })
    }

    const photos = await getListingPhotos(id)

    if (!photos.some(photo => photo.mediaType === 'photo')) {
      throw createError({ statusCode: 400, statusMessage: 'Add at least one photo before submitting' })
    }

    const db = getDb()
    const [row] = await db.update(listings)
      .set({ status: 'moderation', updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning()

    await meilisearchService.removeListing(id).catch(() => undefined)

    return {
      ...mapListing(row),
      photos,
      documents: await getListingDocuments(id),
    }
  },

  updateStatus: async (id: string, status: Listing['status']) => {
    const db = getDb()
    const [row] = await db.update(listings)
      .set({ status, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
    }

    const result = {
      ...mapListing(row),
      photos: await getListingPhotos(id),
      documents: await getListingDocuments(id),
    }

    if (status === 'published') {
      await meilisearchService.indexListing(id).catch(() => undefined)
    } else {
      await meilisearchService.removeListing(id).catch(() => undefined)
    }

    return result
  },

  addPhoto: async (id: string, hostId: string, file: { data: Buffer, filename?: string, type?: string }) => {
    await assertHostOwnership(id, hostId)
    const existingPhotos = await getListingPhotos(id)

    if (existingPhotos.filter(photo => photo.mediaType === 'photo').length >= LISTING_PHOTO_MAX_COUNT) {
      throw createError({ statusCode: 400, statusMessage: 'Photo limit reached' })
    }

    const processed = await processListingPhoto(file.data, file.filename)
    const url = await saveListingPhoto(id, processed)
    const db = getDb()

    const [photo] = await db.insert(listingPhotos).values({
      listingId: id,
      url,
      mediaType: 'photo',
      sortOrder: existingPhotos.length,
    }).returning()

    return mapPhoto(photo)
  },

  addVideo: async (id: string, hostId: string, rawUrl: string) => {
    await assertHostOwnership(id, hostId)
    const parsed = parseVideoEmbedUrl(rawUrl)

    if (!parsed) {
      throw createError({ statusCode: 400, statusMessage: 'Unsupported video URL' })
    }

    const existingPhotos = await getListingPhotos(id)
    const db = getDb()

    const [photo] = await db.insert(listingPhotos).values({
      listingId: id,
      url: parsed.thumbnailUrl || parsed.embedUrl,
      mediaType: 'video',
      embedUrl: parsed.embedUrl,
      provider: parsed.provider,
      sortOrder: existingPhotos.length,
    }).returning()

    return mapPhoto(photo)
  },

  removePhoto: async (id: string, hostId: string, photoId: string) => {
    await assertHostOwnership(id, hostId)
    const db = getDb()

    await db.delete(listingPhotos)
      .where(and(eq(listingPhotos.id, photoId), eq(listingPhotos.listingId, id)))
  },

  reorderPhotos: async (id: string, hostId: string, photoIds: string[]) => {
    await assertHostOwnership(id, hostId)
    const db = getDb()

    await Promise.all(photoIds.map((photoId, index) =>
      db.update(listingPhotos)
        .set({ sortOrder: index })
        .where(and(eq(listingPhotos.id, photoId), eq(listingPhotos.listingId, id))),
    ))

    return getListingPhotos(id)
  },

  addDocument: async (
    id: string,
    hostId: string,
    meta: { title: string },
    file: { data: Buffer, filename?: string, type?: string },
  ) => {
    await assertHostOwnership(id, hostId)

    if (file.data.length > LISTING_DOCUMENT_MAX_BYTES) {
      throw createError({ statusCode: 400, statusMessage: 'Document is too large' })
    }

    const existing = await getListingDocuments(id)

    if (existing.length >= LISTING_DOCUMENT_MAX_COUNT) {
      throw createError({ statusCode: 400, statusMessage: 'Document limit reached' })
    }

    const fileUrl = await saveListingDocument(id, file)
    const db = getDb()

    const [row] = await db.insert(listingDocuments).values({
      listingId: id,
      title: meta.title,
      fileUrl,
      fileName: file.filename ?? 'document',
      sortOrder: existing.length,
    }).returning()

    return mapDocument(row)
  },

  removeDocument: async (id: string, hostId: string, documentId: string) => {
    await assertHostOwnership(id, hostId)
    const db = getDb()

    await db.delete(listingDocuments)
      .where(and(eq(listingDocuments.id, documentId), eq(listingDocuments.listingId, id)))
  },
}
