import type { SpotlightHero, SpotlightPhoto, SpotlightPhotoStatus, SpotlightVoteState } from '#shared/types/spotlight'
import type { SpotlightVoteInput } from '#shared/schemas/spotlight'
import { and, asc, desc, eq, ne, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { bookings, listings, spotlightMonths, spotlightPhotos, spotlightVotes, users } from '../db/schema'
import { getDb } from '../utils/db'
import { processListingPhoto } from '../utils/image'
import { saveSpotlightPhoto } from '../utils/storage'
import { getCurrentMonthKey } from '#shared/utils/spotlight-month'

const mapPhoto = (
  row: typeof spotlightPhotos.$inferSelect,
  extra?: Partial<SpotlightPhoto>,
): SpotlightPhoto => ({
  id: row.id,
  userId: row.userId,
  listingId: row.listingId,
  imageUrl: row.imageUrl,
  caption: row.caption,
  status: row.status as SpotlightPhotoStatus,
  monthKey: row.monthKey,
  voteCount: row.voteCount,
  createdAt: row.createdAt.toISOString(),
  ...extra,
})

const assertMonthOpen = async (monthKey: string) => {
  const db = getDb()
  const [month] = await db.select().from(spotlightMonths)
    .where(eq(spotlightMonths.monthKey, monthKey))
    .limit(1)

  if (month?.closedAt) {
    throw createError({ statusCode: 400, statusMessage: 'Voting for this month is closed' })
  }
}

const assertUserBookedListing = async (userId: string, listingId: string) => {
  const db = getDb()
  const [booking] = await db.select({ id: bookings.id })
    .from(bookings)
    .where(and(
      eq(bookings.guestId, userId),
      eq(bookings.listingId, listingId),
      ne(bookings.status, 'cancelled'),
    ))
    .limit(1)

  if (!booking) {
    throw createError({ statusCode: 400, statusMessage: 'Upload is only allowed for listings you have booked' })
  }
}

const assertPublishedListing = async (listingId: string) => {
  const db = getDb()
  const [listing] = await db.select({ id: listings.id, title: listings.title, city: listings.city })
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.status, 'published')))
    .limit(1)

  if (!listing) {
    throw createError({ statusCode: 400, statusMessage: 'Listing must be published' })
  }

  return listing
}

export const spotlightService = {
  getCurrentMonthKey,

  listApproved: async (monthKey?: string, userId?: string): Promise<SpotlightPhoto[]> => {
    const month = monthKey ?? getCurrentMonthKey()
    const db = getDb()

    const rows = await db.select({
      photo: spotlightPhotos,
      listingTitle: listings.title,
      listingCity: listings.city,
      authorName: users.name,
    })
      .from(spotlightPhotos)
      .innerJoin(listings, eq(spotlightPhotos.listingId, listings.id))
      .innerJoin(users, eq(spotlightPhotos.userId, users.id))
      .where(and(
        eq(spotlightPhotos.monthKey, month),
        eq(spotlightPhotos.status, 'approved'),
      ))
      .orderBy(desc(spotlightPhotos.voteCount), desc(spotlightPhotos.createdAt))

    let votedPhotoId: string | null = null

    if (userId) {
      const [vote] = await db.select({ photoId: spotlightVotes.photoId })
        .from(spotlightVotes)
        .where(and(eq(spotlightVotes.userId, userId), eq(spotlightVotes.monthKey, month)))
        .limit(1)

      votedPhotoId = vote?.photoId ?? null
    }

    return rows.map(row => mapPhoto(row.photo, {
      listingTitle: row.listingTitle,
      listingCity: row.listingCity,
      authorName: row.authorName,
      userVoted: votedPhotoId === row.photo.id,
    }))
  },

  listPending: async (): Promise<SpotlightPhoto[]> => {
    const db = getDb()
    const rows = await db.select({
      photo: spotlightPhotos,
      listingTitle: listings.title,
      listingCity: listings.city,
      authorName: users.name,
    })
      .from(spotlightPhotos)
      .innerJoin(listings, eq(spotlightPhotos.listingId, listings.id))
      .innerJoin(users, eq(spotlightPhotos.userId, users.id))
      .where(eq(spotlightPhotos.status, 'pending'))
      .orderBy(desc(spotlightPhotos.createdAt))

    return rows.map(row => mapPhoto(row.photo, {
      listingTitle: row.listingTitle,
      listingCity: row.listingCity,
      authorName: row.authorName,
    }))
  },

  getVoteState: async (userId: string | undefined, monthKey?: string): Promise<SpotlightVoteState> => {
    const month = monthKey ?? getCurrentMonthKey()
    const db = getDb()
    const [monthRow] = await db.select().from(spotlightMonths)
      .where(eq(spotlightMonths.monthKey, month))
      .limit(1)

    if (!userId) {
      return {
        monthKey: month,
        photoId: null,
        closed: Boolean(monthRow?.closedAt),
      }
    }

    const [vote] = await db.select({ photoId: spotlightVotes.photoId })
      .from(spotlightVotes)
      .where(and(eq(spotlightVotes.userId, userId), eq(spotlightVotes.monthKey, month)))
      .limit(1)

    return {
      monthKey: month,
      photoId: vote?.photoId ?? null,
      closed: Boolean(monthRow?.closedAt),
    }
  },

  upload: async (
    userId: string,
    input: { listingId: string, caption?: string, consent: boolean, file: { data: Buffer, filename?: string, type?: string } },
  ) => {
    if (!input.consent) {
      throw createError({ statusCode: 400, statusMessage: 'Publication consent is required' })
    }

    const monthKey = getCurrentMonthKey()
    await assertMonthOpen(monthKey)
    await assertPublishedListing(input.listingId)
    await assertUserBookedListing(userId, input.listingId)

    const photoId = randomUUID()
    const processed = await processListingPhoto(input.file.data, input.file.filename)
    const imageUrl = await saveSpotlightPhoto(photoId, {
      data: processed.data,
      filename: processed.filename,
      type: processed.type,
    })

    const db = getDb()
    const [row] = await db.insert(spotlightPhotos).values({
      id: photoId,
      userId,
      listingId: input.listingId,
      imageUrl,
      caption: input.caption?.trim() ?? '',
      status: 'pending',
      monthKey,
      consentGiven: true,
    }).returning()

    return mapPhoto(row)
  },

  vote: async (userId: string, input: SpotlightVoteInput) => {
    const monthKey = input.monthKey ?? getCurrentMonthKey()
    await assertMonthOpen(monthKey)

    const db = getDb()
    const [photo] = await db.select().from(spotlightPhotos)
      .where(and(
        eq(spotlightPhotos.id, input.photoId),
        eq(spotlightPhotos.monthKey, monthKey),
        eq(spotlightPhotos.status, 'approved'),
      ))
      .limit(1)

    if (!photo) {
      throw createError({ statusCode: 400, statusMessage: 'Photo is not available for voting' })
    }

    const [existing] = await db.select().from(spotlightVotes)
      .where(and(eq(spotlightVotes.userId, userId), eq(spotlightVotes.monthKey, monthKey)))
      .limit(1)

    if (existing?.photoId === input.photoId) {
      return { monthKey, photoId: input.photoId }
    }

    await db.transaction(async (tx) => {
      if (existing) {
        await tx.update(spotlightPhotos)
          .set({ voteCount: sql`${spotlightPhotos.voteCount} - 1` })
          .where(eq(spotlightPhotos.id, existing.photoId))

        await tx.update(spotlightVotes)
          .set({ photoId: input.photoId })
          .where(eq(spotlightVotes.id, existing.id))
      } else {
        await tx.insert(spotlightVotes).values({
          photoId: input.photoId,
          userId,
          monthKey,
        })
      }

      await tx.update(spotlightPhotos)
        .set({ voteCount: sql`${spotlightPhotos.voteCount} + 1` })
        .where(eq(spotlightPhotos.id, input.photoId))
    })

    return { monthKey, photoId: input.photoId }
  },

  updateStatus: async (photoId: string, status: SpotlightPhotoStatus) => {
    const db = getDb()
    const [row] = await db.update(spotlightPhotos)
      .set({ status })
      .where(eq(spotlightPhotos.id, photoId))
      .returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Photo not found' })
    }

    return mapPhoto(row)
  },

  closeMonth: async (monthKey?: string) => {
    const month = monthKey ?? getCurrentMonthKey()
    const db = getDb()

    const [existing] = await db.select().from(spotlightMonths)
      .where(eq(spotlightMonths.monthKey, month))
      .limit(1)

    if (existing?.closedAt) {
      throw createError({ statusCode: 400, statusMessage: 'Month is already closed' })
    }

    const [winner] = await db.select().from(spotlightPhotos)
      .where(and(
        eq(spotlightPhotos.monthKey, month),
        eq(spotlightPhotos.status, 'approved'),
      ))
      .orderBy(desc(spotlightPhotos.voteCount), asc(spotlightPhotos.createdAt))
      .limit(1)

    if (!winner) {
      throw createError({ statusCode: 400, statusMessage: 'No approved photos to pick a winner' })
    }

    if (existing) {
      await db.update(spotlightMonths)
        .set({ winnerPhotoId: winner.id, closedAt: new Date() })
        .where(eq(spotlightMonths.monthKey, month))
    } else {
      await db.insert(spotlightMonths).values({
        monthKey: month,
        winnerPhotoId: winner.id,
        closedAt: new Date(),
      })
    }

    return { monthKey: month, winnerPhotoId: winner.id }
  },

  getHero: async (): Promise<SpotlightHero> => {
    const db = getDb()
    const [monthRow] = await db.select({
      monthKey: spotlightMonths.monthKey,
      photo: spotlightPhotos,
      listingTitle: listings.title,
      listingCity: listings.city,
      authorName: users.name,
    })
      .from(spotlightMonths)
      .innerJoin(spotlightPhotos, eq(spotlightMonths.winnerPhotoId, spotlightPhotos.id))
      .innerJoin(listings, eq(spotlightPhotos.listingId, listings.id))
      .innerJoin(users, eq(spotlightPhotos.userId, users.id))
      .where(sql`${spotlightMonths.winnerPhotoId} IS NOT NULL`)
      .orderBy(desc(spotlightMonths.monthKey))
      .limit(1)

    if (!monthRow?.photo) {
      return {
        monthKey: null,
        imageUrl: null,
        caption: null,
        listingTitle: null,
        listingCity: null,
        authorName: null,
      }
    }

    return {
      monthKey: monthRow.monthKey,
      imageUrl: monthRow.photo.imageUrl,
      caption: monthRow.photo.caption,
      listingTitle: monthRow.listingTitle,
      listingCity: monthRow.listingCity,
      authorName: monthRow.authorName,
    }
  },
}
