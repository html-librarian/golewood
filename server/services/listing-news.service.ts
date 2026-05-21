import type { BlogPostStatus } from '#shared/types/blog'
import type {
  ListingNewsItem,
  ListingNewsMedia,
  ListingNewsMediaType,
  ListingNewsReaction,
} from '#shared/types/listing-news'
import type { UserRole } from '#shared/types/user'
import type { CreateListingNewsInput, UpdateListingNewsInput } from '#shared/schemas/listing-news'
import { LISTING_NEWS_GALLERY_MAX } from '#shared/constants/listing-news'
import { resolveStoryMediaType } from '#shared/utils/story-media'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { listingNews, listingNewsMedia, listingNewsReactions, listings } from '../db/schema'
import { getDb } from '../utils/db'
import { saveListingNewsMedia } from '../utils/storage'
import { parseVideoEmbedUrl } from '#shared/utils/video-embed'

const mapMedia = (row: typeof listingNewsMedia.$inferSelect): ListingNewsMedia => ({
  id: row.id,
  newsId: row.newsId,
  url: row.url,
  mediaType: row.mediaType as ListingNewsMediaType,
  embedUrl: row.embedUrl,
  provider: row.provider,
  sortOrder: row.sortOrder,
})

const mapNews = (
  row: typeof listingNews.$inferSelect,
  extras?: { media?: ListingNewsMedia[], userReaction?: ListingNewsReaction | null },
): ListingNewsItem => ({
  id: row.id,
  listingId: row.listingId,
  title: row.title,
  body: row.body,
  excerpt: row.excerpt,
  previewImageUrl: row.previewImageUrl,
  showBookingButton: row.showBookingButton,
  likesCount: row.likesCount,
  dislikesCount: row.dislikesCount,
  status: row.status as BlogPostStatus,
  publishedAt: row.publishedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  media: extras?.media,
  userReaction: extras?.userReaction ?? null,
})

type NewsEditor = { id: string, role: UserRole }

const assertNewsEditor = async (listingId: string, user: NewsEditor) => {
  const db = getDb()
  const [listing] = await db.select({ id: listings.id, hostId: listings.hostId })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1)

  if (!listing) {
    throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
  }

  const isStaff = user.role === 'admin' || user.role === 'content_manager'

  if (!isStaff && listing.hostId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return listing
}

const loadMediaForNews = async (newsIds: string[]) => {
  if (!newsIds.length) {
    return new Map<string, ListingNewsMedia[]>()
  }

  const db = getDb()
  const rows = await db.select().from(listingNewsMedia)
    .where(inArray(listingNewsMedia.newsId, newsIds))
    .orderBy(asc(listingNewsMedia.sortOrder), asc(listingNewsMedia.createdAt))

  const map = new Map<string, ListingNewsMedia[]>()

  for (const row of rows) {
    const list = map.get(row.newsId) ?? []
    list.push(mapMedia(row))
    map.set(row.newsId, list)
  }

  return map
}

const loadUserReactions = async (newsIds: string[], userId?: string) => {
  const map = new Map<string, ListingNewsReaction>()

  if (!userId || !newsIds.length) {
    return map
  }

  const db = getDb()
  const rows = await db.select().from(listingNewsReactions)
    .where(and(
      inArray(listingNewsReactions.newsId, newsIds),
      eq(listingNewsReactions.userId, userId),
    ))

  for (const row of rows) {
    map.set(row.newsId, row.reaction as ListingNewsReaction)
  }

  return map
}

const enrichNewsRows = async (
  rows: typeof listingNews.$inferSelect[],
  userId?: string,
  withMedia = false,
): Promise<ListingNewsItem[]> => {
  const ids = rows.map(row => row.id)
  const mediaMap = withMedia ? await loadMediaForNews(ids) : new Map()
  const reactionMap = await loadUserReactions(ids, userId)

  return rows.map(row => mapNews(row, {
    media: withMedia ? (mediaMap.get(row.id) ?? []) : undefined,
    userReaction: reactionMap.get(row.id) ?? null,
  }))
}

const assertPublishedNews = async (listingId: string, newsId: string) => {
  const db = getDb()
  const [row] = await db.select().from(listingNews)
    .where(and(
      eq(listingNews.id, newsId),
      eq(listingNews.listingId, listingId),
      eq(listingNews.status, 'published'),
    ))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'News not found' })
  }

  return row
}

export const listingNewsService = {
  listPublishedForHost: async (hostId: string, userId?: string, limit = 24) => {
    const db = getDb()

    const rows = await db.select({
      news: listingNews,
      listingId: listings.id,
      listingTitle: listings.title,
    })
      .from(listingNews)
      .innerJoin(listings, eq(listingNews.listingId, listings.id))
      .where(and(
        eq(listingNews.hostId, hostId),
        eq(listingNews.status, 'published'),
        eq(listings.status, 'published'),
      ))
      .orderBy(desc(listingNews.publishedAt), desc(listingNews.createdAt))
      .limit(limit)

    const enriched = await enrichNewsRows(rows.map(row => row.news), userId, false)
    const enrichedById = new Map(enriched.map(item => [item.id, item]))

    return rows.flatMap((row) => {
      const item = enrichedById.get(row.news.id)

      if (!item) {
        return []
      }

      return [{
        ...item,
        listingId: row.listingId,
        listingTitle: row.listingTitle,
      }]
    })
  },

  listPublishedForListing: async (listingId: string, userId?: string, limit = 20) => {
    const db = getDb()
    const rows = await db.select().from(listingNews)
      .where(and(
        eq(listingNews.listingId, listingId),
        eq(listingNews.status, 'published'),
      ))
      .orderBy(desc(listingNews.publishedAt), desc(listingNews.createdAt))
      .limit(limit)

    return enrichNewsRows(rows, userId, false)
  },

  getPublishedById: async (listingId: string, newsId: string, userId?: string) => {
    const row = await assertPublishedNews(listingId, newsId)
    const [item] = await enrichNewsRows([row], userId, true)
    return item
  },

  listForHost: async (listingId: string, user: NewsEditor) => {
    await assertNewsEditor(listingId, user)
    const db = getDb()

    const rows = await db.select().from(listingNews)
      .where(eq(listingNews.listingId, listingId))
      .orderBy(desc(listingNews.updatedAt))

    return enrichNewsRows(rows, user.id, true)
  },

  create: async (listingId: string, user: NewsEditor, input: CreateListingNewsInput) => {
    const listing = await assertNewsEditor(listingId, user)
    const db = getDb()
    const now = new Date()
    const publishedAt = input.status === 'published' ? now : null

    const [row] = await db.insert(listingNews).values({
      listingId,
      hostId: listing.hostId,
      title: input.title,
      body: input.body,
      excerpt: input.excerpt.trim(),
      showBookingButton: input.showBookingButton,
      status: input.status,
      publishedAt,
      updatedAt: now,
    }).returning()

    return mapNews(row, { media: [], userReaction: null })
  },

  update: async (newsId: string, listingId: string, user: NewsEditor, input: UpdateListingNewsInput) => {
    await assertNewsEditor(listingId, user)
    const db = getDb()

    const [existing] = await db.select().from(listingNews)
      .where(and(eq(listingNews.id, newsId), eq(listingNews.listingId, listingId)))
      .limit(1)

    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'News not found' })
    }

    const patch: Partial<typeof listingNews.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.title !== undefined) {
      patch.title = input.title
    }
    if (input.body !== undefined) {
      patch.body = input.body
    }
    if (input.excerpt !== undefined) {
      patch.excerpt = input.excerpt.trim()
    }
    if (input.showBookingButton !== undefined) {
      patch.showBookingButton = input.showBookingButton
    }
    if (input.status !== undefined) {
      patch.status = input.status
      patch.publishedAt = input.status === 'published'
        ? (existing.publishedAt ?? new Date())
        : null
    }

    const [row] = await db.update(listingNews).set(patch).where(eq(listingNews.id, newsId)).returning()
    const media = await loadMediaForNews([newsId])
    return mapNews(row, { media: media.get(newsId) ?? [], userReaction: null })
  },

  delete: async (newsId: string, listingId: string, user: NewsEditor) => {
    await assertNewsEditor(listingId, user)
    const db = getDb()

    const [row] = await db.delete(listingNews)
      .where(and(eq(listingNews.id, newsId), eq(listingNews.listingId, listingId)))
      .returning({ id: listingNews.id })

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'News not found' })
    }
  },

  setPreviewImage: async (newsId: string, listingId: string, user: NewsEditor, url: string) => {
    await assertNewsEditor(listingId, user)
    const db = getDb()

    const [row] = await db.update(listingNews)
      .set({ previewImageUrl: url, updatedAt: new Date() })
      .where(and(eq(listingNews.id, newsId), eq(listingNews.listingId, listingId)))
      .returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'News not found' })
    }

    return mapNews(row)
  },

  addMedia: async (
    newsId: string,
    listingId: string,
    user: NewsEditor,
    file: { data: Buffer, filename?: string, type?: string },
    embedUrl?: string,
  ) => {
    await assertNewsEditor(listingId, user)
    const db = getDb()

    const [news] = await db.select({ id: listingNews.id })
      .from(listingNews)
      .where(and(eq(listingNews.id, newsId), eq(listingNews.listingId, listingId)))
      .limit(1)

    if (!news) {
      throw createError({ statusCode: 404, statusMessage: 'News not found' })
    }

    const [countRow] = await db.select({ count: sql<number>`count(*)::int` })
      .from(listingNewsMedia)
      .where(eq(listingNewsMedia.newsId, newsId))

    if ((countRow?.count ?? 0) >= LISTING_NEWS_GALLERY_MAX) {
      throw createError({ statusCode: 400, statusMessage: `Gallery limit is ${LISTING_NEWS_GALLERY_MAX} items` })
    }

    let url = ''
    let mediaType: ListingNewsMediaType = 'photo'
    let parsedEmbed: ReturnType<typeof parseVideoEmbedUrl> = null
    let provider: string | null = null
    let storedEmbedUrl: string | null = null

    if (embedUrl?.trim()) {
      parsedEmbed = parseVideoEmbedUrl(embedUrl.trim())

      if (!parsedEmbed) {
        throw createError({ statusCode: 400, statusMessage: 'Unsupported video URL' })
      }

      mediaType = 'video'
      url = parsedEmbed.thumbnailUrl ?? parsedEmbed.embedUrl
      provider = parsedEmbed.provider
      storedEmbedUrl = parsedEmbed.embedUrl
    } else {
      const resolved = resolveStoryMediaType(file.filename, file.type)
      mediaType = resolved === 'video' ? 'video' : 'photo'
      url = await saveListingNewsMedia(newsId, file, mediaType)
    }

    const [row] = await db.insert(listingNewsMedia).values({
      newsId,
      url,
      mediaType,
      embedUrl: storedEmbedUrl,
      provider,
      sortOrder: countRow?.count ?? 0,
    }).returning()

    return mapMedia(row)
  },

  removeMedia: async (mediaId: string, newsId: string, listingId: string, user: NewsEditor) => {
    await assertNewsEditor(listingId, user)
    const db = getDb()

    const [row] = await db.delete(listingNewsMedia)
      .where(and(eq(listingNewsMedia.id, mediaId), eq(listingNewsMedia.newsId, newsId)))
      .returning({ id: listingNewsMedia.id })

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Media not found' })
    }
  },

  setReaction: async (listingId: string, newsId: string, userId: string, reaction: ListingNewsReaction) => {
    await assertPublishedNews(listingId, newsId)
    const db = getDb()

    return db.transaction(async (tx) => {
      const [existing] = await tx.select().from(listingNewsReactions)
        .where(and(
          eq(listingNewsReactions.newsId, newsId),
          eq(listingNewsReactions.userId, userId),
        ))
        .limit(1)

      const [news] = await tx.select({
        likesCount: listingNews.likesCount,
        dislikesCount: listingNews.dislikesCount,
      })
        .from(listingNews)
        .where(eq(listingNews.id, newsId))
        .limit(1)

      if (!news) {
        throw createError({ statusCode: 404, statusMessage: 'News not found' })
      }

      let likes = news.likesCount
      let dislikes = news.dislikesCount
      let userReaction: ListingNewsReaction | null = reaction

      if (existing) {
        if (existing.reaction === reaction) {
          await tx.delete(listingNewsReactions)
            .where(and(
              eq(listingNewsReactions.newsId, newsId),
              eq(listingNewsReactions.userId, userId),
            ))

          if (reaction === 'like') {
            likes = Math.max(0, likes - 1)
          } else {
            dislikes = Math.max(0, dislikes - 1)
          }

          userReaction = null
        } else {
          await tx.update(listingNewsReactions)
            .set({ reaction })
            .where(and(
              eq(listingNewsReactions.newsId, newsId),
              eq(listingNewsReactions.userId, userId),
            ))

          if (existing.reaction === 'like') {
            likes = Math.max(0, likes - 1)
            dislikes += 1
          } else {
            dislikes = Math.max(0, dislikes - 1)
            likes += 1
          }
        }
      } else {
        await tx.insert(listingNewsReactions).values({ newsId, userId, reaction })

        if (reaction === 'like') {
          likes += 1
        } else {
          dislikes += 1
        }
      }

      await tx.update(listingNews)
        .set({ likesCount: likes, dislikesCount: dislikes, updatedAt: new Date() })
        .where(eq(listingNews.id, newsId))

      return { likesCount: likes, dislikesCount: dislikes, userReaction }
    })
  },

  attachCardMeta: async <T extends {
    id: string
    teamBadgeBlogPost?: { excerptRu: string, excerptEn: string } | null
  }>(items: T[]) => {
    if (!items.length) {
      return items
    }

    const db = getDb()
    const ids = items.map(item => item.id)

    const counts = await db.select({
      listingId: listingNews.listingId,
      count: sql<number>`count(*)::int`,
    })
      .from(listingNews)
      .where(and(
        inArray(listingNews.listingId, ids),
        eq(listingNews.status, 'published'),
      ))
      .groupBy(listingNews.listingId)

    const countMap = new Map(counts.map(row => [row.listingId, row.count]))

    const latestRows = await db.select().from(listingNews)
      .where(and(
        inArray(listingNews.listingId, ids),
        eq(listingNews.status, 'published'),
      ))
      .orderBy(desc(listingNews.publishedAt), desc(listingNews.createdAt))

    const latestMap = new Map<string, typeof listingNews.$inferSelect>()
    for (const row of latestRows) {
      if (!latestMap.has(row.listingId)) {
        latestMap.set(row.listingId, row)
      }
    }

    return items.map((item) => {
      const latest = latestMap.get(item.id)
      const blog = item.teamBadgeBlogPost

      return {
        ...item,
        hostNewsCount: countMap.get(item.id) ?? 0,
        latestHostNewsTitle: latest?.title ?? null,
        latestHostNewsExcerpt: latest?.excerpt ?? null,
        latestHostNewsAt: latest?.publishedAt?.toISOString() ?? latest?.createdAt.toISOString() ?? null,
        latestHostNewsPreviewUrl: latest?.previewImageUrl ?? null,
        teamReviewExcerptRu: blog?.excerptRu || null,
        teamReviewExcerptEn: blog?.excerptEn || null,
      }
    })
  },
}
