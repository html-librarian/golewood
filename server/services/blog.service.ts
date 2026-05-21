import type { BlogPost, BlogPostCard, BlogPostStatus } from '#shared/types/blog'
import type { CreateBlogPostInput, UpdateBlogPostInput } from '#shared/schemas/blog'
import { slugFromTitle } from '#shared/utils/slug'
import { and, desc, eq, inArray, ne } from 'drizzle-orm'
import { blogPosts, listings } from '../db/schema'
import { getDb } from '../utils/db'

const mapCard = (row: typeof blogPosts.$inferSelect): BlogPostCard => ({
  id: row.id,
  slug: row.slug,
  titleRu: row.titleRu,
  titleEn: row.titleEn,
  excerptRu: row.excerptRu,
  excerptEn: row.excerptEn,
  coverImageUrl: row.coverImageUrl,
  listingId: row.listingId,
  publishedAt: row.publishedAt?.toISOString() ?? null,
})

const mapPost = (
  row: typeof blogPosts.$inferSelect,
  extra?: { listingTitle?: string | null, listingCity?: string | null },
): BlogPost => ({
  ...mapCard(row),
  bodyRu: row.bodyRu,
  bodyEn: row.bodyEn,
  status: row.status as BlogPostStatus,
  listingTitle: extra?.listingTitle ?? null,
  listingCity: extra?.listingCity ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

const uniqueSlug = async (base: string, excludeId?: string) => {
  const db = getDb()
  let candidate = base
  let suffix = 2

  while (true) {
    const [existing] = await db.select({ id: blogPosts.id }).from(blogPosts)
      .where(excludeId
        ? and(eq(blogPosts.slug, candidate), ne(blogPosts.id, excludeId))
        : eq(blogPosts.slug, candidate))
      .limit(1)

    if (!existing) {
      return candidate
    }

    candidate = `${base}-${suffix}`
    suffix++
  }
}

const assertListingExists = async (listingId: string) => {
  const db = getDb()
  const [listing] = await db.select({ id: listings.id }).from(listings).where(eq(listings.id, listingId)).limit(1)

  if (!listing) {
    throw createError({ statusCode: 400, statusMessage: 'Listing not found' })
  }
}

export const blogService = {
  listPublished: async (limit = 50): Promise<BlogPostCard[]> => {
    const db = getDb()
    const rows = await db.select().from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt))
      .limit(limit)

    return rows.map(mapCard)
  },

  getPublishedBySlug: async (slug: string): Promise<BlogPost> => {
    const db = getDb()
    const [row] = await db.select({
      post: blogPosts,
      listingTitle: listings.title,
      listingCity: listings.city,
    })
      .from(blogPosts)
      .leftJoin(listings, eq(blogPosts.listingId, listings.id))
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published')))
      .limit(1)

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Blog post not found' })
    }

    return mapPost(row.post, {
      listingTitle: row.listingTitle,
      listingCity: row.listingCity,
    })
  },

  listForListing: async (listingId: string, publishedOnly = false): Promise<BlogPostCard[]> => {
    const db = getDb()
    const conditions = [eq(blogPosts.listingId, listingId)]

    if (publishedOnly) {
      conditions.push(eq(blogPosts.status, 'published'))
    }

    const rows = await db.select().from(blogPosts)
      .where(and(...conditions))
      .orderBy(desc(blogPosts.updatedAt))

    return rows.map(mapCard)
  },

  listAdmin: async (listingId?: string): Promise<BlogPost[]> => {
    const db = getDb()
    const rows = await db.select({
      post: blogPosts,
      listingTitle: listings.title,
      listingCity: listings.city,
    })
      .from(blogPosts)
      .leftJoin(listings, eq(blogPosts.listingId, listings.id))
      .where(listingId ? eq(blogPosts.listingId, listingId) : undefined)
      .orderBy(desc(blogPosts.updatedAt))

    return rows.map(row => mapPost(row.post, {
      listingTitle: row.listingTitle,
      listingCity: row.listingCity,
    }))
  },

  create: async (input: CreateBlogPostInput) => {
    await assertListingExists(input.listingId)
    const db = getDb()
    const baseSlug = input.slug ?? slugFromTitle(input.titleRu)
    const slug = await uniqueSlug(baseSlug)
    const now = new Date()
    const publishedAt = input.status === 'published' ? now : null

    const [row] = await db.insert(blogPosts).values({
      slug,
      titleRu: input.titleRu,
      titleEn: input.titleEn ?? input.titleRu,
      excerptRu: input.excerptRu,
      excerptEn: input.excerptEn ?? input.excerptRu,
      bodyRu: input.bodyRu,
      bodyEn: input.bodyEn ?? input.bodyRu,
      coverImageUrl: input.coverImageUrl ?? null,
      listingId: input.listingId,
      status: input.status,
      publishedAt,
      updatedAt: now,
    }).returning()

    return mapPost(row)
  },

  update: async (id: string, input: UpdateBlogPostInput) => {
    const db = getDb()
    const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1)

    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Blog post not found' })
    }

    if (input.listingId) {
      await assertListingExists(input.listingId)
    }

    const patch: Partial<typeof blogPosts.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.titleRu !== undefined) {
      patch.titleRu = input.titleRu
    }
    if (input.titleEn !== undefined) {
      patch.titleEn = input.titleEn
    }
    if (input.excerptRu !== undefined) {
      patch.excerptRu = input.excerptRu
    }
    if (input.excerptEn !== undefined) {
      patch.excerptEn = input.excerptEn
    }
    if (input.bodyRu !== undefined) {
      patch.bodyRu = input.bodyRu
    }
    if (input.bodyEn !== undefined) {
      patch.bodyEn = input.bodyEn
    }
    if (input.coverImageUrl !== undefined) {
      patch.coverImageUrl = input.coverImageUrl
    }
    if (input.listingId !== undefined) {
      patch.listingId = input.listingId
    }
    if (input.status !== undefined) {
      patch.status = input.status
      patch.publishedAt = input.status === 'published'
        ? (existing.publishedAt ?? new Date())
        : null
    }
    if (input.slug !== undefined) {
      patch.slug = await uniqueSlug(input.slug, id)
    }

    const [row] = await db.update(blogPosts).set(patch).where(eq(blogPosts.id, id)).returning()
    return mapPost(row)
  },

  assertPublishedForListing: async (blogPostId: string, listingId: string) => {
    const db = getDb()
    const [row] = await db.select().from(blogPosts)
      .where(and(
        eq(blogPosts.id, blogPostId),
        eq(blogPosts.listingId, listingId),
        eq(blogPosts.status, 'published'),
      ))
      .limit(1)

    if (!row) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Select a published blog post linked to this listing',
      })
    }

    return mapCard(row)
  },

  getCardsByIds: async (ids: string[]) => {
    const map = new Map<string, BlogPostCard>()

    if (!ids.length) {
      return map
    }

    const db = getDb()
    const rows = await db.select().from(blogPosts).where(inArray(blogPosts.id, ids))

    for (const row of rows) {
      map.set(row.id, mapCard(row))
    }

    return map
  },
}
