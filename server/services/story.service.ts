import type { MyStoriesResponse, UserStory } from '#shared/types/story'
import type { User } from '#shared/types/user'
import { and, asc, desc, eq, gt, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import {
  hostProfileStoryReposts,
  listingStoryPins,
  listings,
  userStories,
  users,
} from '../db/schema'
import { getDb } from '../utils/db'
import { STORY_IMAGE_MAX_BYTES, STORY_VIDEO_MAX_BYTES } from '#shared/utils/media-limits'
import { resolveStoryMediaType } from '#shared/utils/story-media'
import { processListingPhoto } from '../utils/image'
import { saveUserStory } from '../utils/storage'

const getStoryTtlHours = () => {
  const config = useRuntimeConfig()
  const hours = Number(config.storyTtlHours || 24)
  return hours > 0 ? hours : 24
}

const getExpiresAt = () => {
  const hours = getStoryTtlHours()
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

const notExpired = () => gt(userStories.expiresAt, new Date())

const isStoryExpired = (expiresAt: Date) => expiresAt <= new Date()

const mapStory = (
  row: typeof userStories.$inferSelect,
  extra?: Partial<UserStory>,
): UserStory => ({
  id: row.id,
  userId: row.userId,
  listingId: row.listingId,
  mediaUrl: row.mediaUrl,
  mediaType: row.mediaType,
  expiresAt: row.expiresAt.toISOString(),
  createdAt: row.createdAt.toISOString(),
  isExpired: isStoryExpired(row.expiresAt),
  ...extra,
})

const assertPublishedListing = async (listingId: string) => {
  const db = getDb()
  const [listing] = await db.select({
    id: listings.id,
    title: listings.title,
    city: listings.city,
    hostId: listings.hostId,
  })
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.status, 'published')))
    .limit(1)

  if (!listing) {
    throw createError({ statusCode: 400, statusMessage: 'Listing must be published' })
  }

  return listing
}

const assertHostCanManage = async (listingId: string, user: Pick<User, 'id' | 'role'>) => {
  const db = getDb()
  const [listing] = await db.select({
    id: listings.id,
    title: listings.title,
    city: listings.city,
    hostId: listings.hostId,
    status: listings.status,
  })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1)

  if (!listing) {
    throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
  }

  if (user.role !== 'admin' && listing.hostId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return listing
}

const assertActiveStoryForListing = async (storyId: string, listingId: string) => {
  const db = getDb()
  const [story] = await db.select()
    .from(userStories)
    .where(and(
      eq(userStories.id, storyId),
      eq(userStories.listingId, listingId),
      notExpired(),
    ))
    .limit(1)

  if (!story) {
    throw createError({ statusCode: 404, statusMessage: 'Story not found or expired' })
  }

  return story
}


export const storyService = {
  create: async (
    userId: string,
    input: { listingId: string, file: { data: Buffer, filename?: string, type?: string } },
  ): Promise<UserStory> => {
    const listing = await assertPublishedListing(input.listingId)
    const mediaType = resolveStoryMediaType(input.file.filename, input.file.type)
    const storyId = randomUUID()

    const mediaUrl = mediaType === 'image'
      ? await (async () => {
          const processed = await processListingPhoto(input.file.data, input.file.filename)

          if (processed.data.length > STORY_IMAGE_MAX_BYTES) {
            throw createError({
              statusCode: 400,
              statusMessage: `Image exceeds ${Math.round(STORY_IMAGE_MAX_BYTES / 1024 / 1024)} MB limit`,
            })
          }

          return saveUserStory(storyId, {
            data: processed.data,
            filename: processed.filename,
            type: processed.type,
          }, 'image')
        })()
      : await (async () => {
          if (input.file.data.length > STORY_VIDEO_MAX_BYTES) {
            throw createError({
              statusCode: 400,
              statusMessage: `Video exceeds ${Math.round(STORY_VIDEO_MAX_BYTES / 1024 / 1024)} MB limit`,
            })
          }

          return saveUserStory(storyId, {
            data: input.file.data,
            filename: input.file.filename,
            type: input.file.type,
          }, 'video')
        })()

    const db = getDb()
    const [row] = await db.insert(userStories).values({
      id: storyId,
      userId,
      listingId: input.listingId,
      mediaUrl,
      mediaType,
      expiresAt: getExpiresAt(),
    }).returning()

    return mapStory(row, {
      listingTitle: listing.title,
      listingCity: listing.city,
      isExpired: false,
    })
  },

  listMine: async (userId: string): Promise<MyStoriesResponse> => {
    const db = getDb()
    const rows = await db.select({
      story: userStories,
      listingTitle: listings.title,
      listingCity: listings.city,
    })
      .from(userStories)
      .innerJoin(listings, eq(userStories.listingId, listings.id))
      .where(eq(userStories.userId, userId))
      .orderBy(desc(userStories.createdAt))

    const mapped = rows.map(row => mapStory(row.story, {
      listingTitle: row.listingTitle,
      listingCity: row.listingCity,
    }))

    return {
      active: mapped.filter(story => !story.isExpired),
      archive: mapped.filter(story => story.isExpired),
    }
  },

  listPinnedForListing: async (listingId: string): Promise<UserStory[]> => {
    const db = getDb()
    const rows = await db.select({
      story: userStories,
      listingTitle: listings.title,
      listingCity: listings.city,
      authorName: users.name,
    })
      .from(listingStoryPins)
      .innerJoin(userStories, eq(listingStoryPins.storyId, userStories.id))
      .innerJoin(listings, eq(userStories.listingId, listings.id))
      .innerJoin(users, eq(userStories.userId, users.id))
      .where(and(
        eq(listingStoryPins.listingId, listingId),
        eq(userStories.listingId, listingId),
        notExpired(),
      ))
      .orderBy(asc(listingStoryPins.sortOrder), desc(userStories.createdAt))

    return rows.map(row => mapStory(row.story, {
      listingTitle: row.listingTitle,
      listingCity: row.listingCity,
      authorName: row.authorName,
      pinned: true,
      isExpired: false,
    }))
  },

  listForHost: async (listingId: string, user: Pick<User, 'id' | 'role'>): Promise<UserStory[]> => {
    const listing = await assertHostCanManage(listingId, user)
    const hostId = listing.hostId
    const db = getDb()

    const rows = await db.select({
      story: userStories,
      authorName: users.name,
      pinSort: listingStoryPins.sortOrder,
      repostSort: hostProfileStoryReposts.sortOrder,
    })
      .from(userStories)
      .innerJoin(users, eq(userStories.userId, users.id))
      .leftJoin(
        listingStoryPins,
        and(
          eq(listingStoryPins.storyId, userStories.id),
          eq(listingStoryPins.listingId, listingId),
        ),
      )
      .leftJoin(
        hostProfileStoryReposts,
        and(
          eq(hostProfileStoryReposts.storyId, userStories.id),
          eq(hostProfileStoryReposts.hostId, hostId),
        ),
      )
      .where(eq(userStories.listingId, listingId))
      .orderBy(desc(userStories.createdAt))

    return rows.map(row => mapStory(row.story, {
      authorName: row.authorName,
      pinned: row.pinSort !== null && row.pinSort !== undefined,
      reposted: row.repostSort !== null && row.repostSort !== undefined,
    }))
  },

  listRepostedForHostProfile: async (hostId: string): Promise<UserStory[]> => {
    const db = getDb()
    const rows = await db.select({
      story: userStories,
      listingTitle: listings.title,
      listingCity: listings.city,
      authorName: users.name,
    })
      .from(hostProfileStoryReposts)
      .innerJoin(userStories, eq(hostProfileStoryReposts.storyId, userStories.id))
      .innerJoin(listings, eq(userStories.listingId, listings.id))
      .innerJoin(users, eq(userStories.userId, users.id))
      .where(eq(hostProfileStoryReposts.hostId, hostId))
      .orderBy(asc(hostProfileStoryReposts.sortOrder), desc(hostProfileStoryReposts.createdAt))

    return rows.map(row => mapStory(row.story, {
      listingTitle: row.listingTitle,
      listingCity: row.listingCity,
      authorName: row.authorName,
      reposted: true,
    }))
  },

  pin: async (listingId: string, user: Pick<User, 'id' | 'role'>, storyId: string) => {
    await assertHostCanManage(listingId, user)
    await assertActiveStoryForListing(storyId, listingId)

    const db = getDb()
    const [maxRow] = await db.select({
      max: sql<number>`coalesce(max(${listingStoryPins.sortOrder}), -1)`,
    })
      .from(listingStoryPins)
      .where(eq(listingStoryPins.listingId, listingId))

    const sortOrder = Number(maxRow?.max ?? -1) + 1

    await db.insert(listingStoryPins)
      .values({ listingId, storyId, sortOrder })
      .onConflictDoNothing()

    return { listingId, storyId, pinned: true }
  },

  unpin: async (listingId: string, user: Pick<User, 'id' | 'role'>, storyId: string) => {
    await assertHostCanManage(listingId, user)

    const db = getDb()
    await db.delete(listingStoryPins)
      .where(and(
        eq(listingStoryPins.listingId, listingId),
        eq(listingStoryPins.storyId, storyId),
      ))

    return { listingId, storyId, pinned: false }
  },

  repostToProfile: async (user: Pick<User, 'id' | 'role'>, storyId: string) => {
    const db = getDb()
    const [story] = await db.select()
      .from(userStories)
      .where(eq(userStories.id, storyId))
      .limit(1)

    if (!story) {
      throw createError({ statusCode: 404, statusMessage: 'Story not found' })
    }

    const listing = await assertHostCanManage(story.listingId, user)
    const hostId = listing.hostId

    const [maxRow] = await db.select({
      max: sql<number>`coalesce(max(${hostProfileStoryReposts.sortOrder}), -1)`,
    })
      .from(hostProfileStoryReposts)
      .where(eq(hostProfileStoryReposts.hostId, hostId))

    const sortOrder = Number(maxRow?.max ?? -1) + 1

    await db.insert(hostProfileStoryReposts)
      .values({ hostId, storyId, sortOrder })
      .onConflictDoNothing()

    return { hostId, storyId, reposted: true }
  },

  unrepostFromProfile: async (user: Pick<User, 'id' | 'role'>, storyId: string) => {
    const db = getDb()
    const [story] = await db.select()
      .from(userStories)
      .where(eq(userStories.id, storyId))
      .limit(1)

    if (!story) {
      throw createError({ statusCode: 404, statusMessage: 'Story not found' })
    }

    const listing = await assertHostCanManage(story.listingId, user)
    const hostId = listing.hostId

    await db.delete(hostProfileStoryReposts)
      .where(and(
        eq(hostProfileStoryReposts.hostId, hostId),
        eq(hostProfileStoryReposts.storyId, storyId),
      ))

    return { hostId, storyId, reposted: false }
  },
}
