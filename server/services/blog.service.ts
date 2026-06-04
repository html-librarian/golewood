import type {
  BlogAuthorSummary,
  BlogPost,
  BlogPostCard,
  BlogPostSearchParams,
  BlogPostSearchResult,
  BlogPostStatus,
} from '#shared/types/blog'
import type { CreateBlogPostInput, UpdateBlogPostInput, UserCreateBlogPostInput } from '#shared/schemas/blog'
import { slugFromTitle } from '#shared/utils/slug'
import { buildFullName, resolveUserNameParts } from '#shared/utils/user-name'
import { and, count, desc, eq, ilike, inArray, isNotNull, ne, or, sql } from 'drizzle-orm'
import { blogAuthorFollows, blogPosts, listings, users } from '../db/schema'
import { getDb } from '../utils/db'

type AuthorRow = {
  authorName: string | null
  authorFirstName: string | null
  authorLastName: string | null
}

const authorDisplayName = (row: AuthorRow) => {
  const parts = resolveUserNameParts({
    name: row.authorName,
    firstName: row.authorFirstName,
    lastName: row.authorLastName,
  })

  if (parts.lastName && parts.firstName) {
    return buildFullName(parts)
  }

  return row.authorName?.trim() || null
}

const resolveCity = (post: typeof blogPosts.$inferSelect, listingCity: string | null) =>
  post.city?.trim() || listingCity

const mapCard = (
  row: typeof blogPosts.$inferSelect,
  extra?: {
    listingTitle?: string | null
    listingCity?: string | null
    authorName?: string | null
  },
): BlogPostCard => ({
  id: row.id,
  slug: row.slug,
  titleRu: row.titleRu,
  titleEn: row.titleEn,
  excerptRu: row.excerptRu,
  excerptEn: row.excerptEn,
  coverImageUrl: row.coverImageUrl,
  listingId: row.listingId,
  authorId: row.authorId,
  authorName: extra?.authorName ?? null,
  city: resolveCity(row, extra?.listingCity ?? null),
  listingTitle: extra?.listingTitle ?? null,
  listingCity: extra?.listingCity ?? null,
  publishedAt: row.publishedAt?.toISOString() ?? null,
})

const mapPost = (
  row: typeof blogPosts.$inferSelect,
  extra?: {
    listingTitle?: string | null
    listingCity?: string | null
    authorName?: string | null
    authorIsFollowing?: boolean
  },
): BlogPost => ({
  ...mapCard(row, extra),
  bodyRu: row.bodyRu,
  bodyEn: row.bodyEn,
  status: row.status as BlogPostStatus,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  authorIsFollowing: extra?.authorIsFollowing,
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
  const [listing] = await db.select({ id: listings.id, city: listings.city }).from(listings).where(eq(listings.id, listingId)).limit(1)

  if (!listing) {
    throw createError({ statusCode: 400, statusMessage: 'Listing not found' })
  }

  return listing
}

const buildSearchConditions = (params: BlogPostSearchParams) => {
  const conditions = [eq(blogPosts.status, 'published')]

  if (params.authorId) {
    conditions.push(eq(blogPosts.authorId, params.authorId))
  }

  if (params.listingId) {
    conditions.push(eq(blogPosts.listingId, params.listingId))
  }

  if (params.city) {
    conditions.push(or(
      ilike(blogPosts.city, params.city),
      ilike(listings.city, params.city),
    )!)
  }

  if (params.q) {
    const pattern = `%${params.q}%`
    conditions.push(or(
      ilike(blogPosts.titleRu, pattern),
      ilike(blogPosts.titleEn, pattern),
      ilike(blogPosts.excerptRu, pattern),
      ilike(blogPosts.excerptEn, pattern),
    )!)
  }

  if (params.authorQ) {
    const pattern = `%${params.authorQ}%`
    conditions.push(or(
      ilike(users.name, pattern),
      ilike(users.firstName, pattern),
      ilike(users.lastName, pattern),
    )!)
  }

  return conditions
}

const insertPost = async (
  input: CreateBlogPostInput | UserCreateBlogPostInput,
  authorId: string | null,
) => {
  if (input.listingId) {
    await assertListingExists(input.listingId)
  }

  const db = getDb()
  const baseSlug = input.slug ?? slugFromTitle(input.titleRu)
  const slug = await uniqueSlug(baseSlug)
  const now = new Date()
  const publishedAt = input.status === 'published' ? now : null

  let city = input.city?.trim() || null

  if (input.listingId && !city) {
    const [listing] = await db.select({ city: listings.city }).from(listings).where(eq(listings.id, input.listingId)).limit(1)
    city = listing?.city ?? null
  }

  const [row] = await db.insert(blogPosts).values({
    slug,
    titleRu: input.titleRu,
    titleEn: input.titleEn ?? input.titleRu,
    excerptRu: input.excerptRu,
    excerptEn: input.excerptEn ?? input.excerptRu,
    bodyRu: input.bodyRu,
    bodyEn: input.bodyEn ?? input.bodyRu,
    coverImageUrl: input.coverImageUrl ?? null,
    listingId: input.listingId ?? null,
    authorId,
    city,
    status: input.status,
    publishedAt,
    updatedAt: now,
  }).returning()

  return mapPost(row)
}

type AuthorAggregateRow = {
  authorId: string | null
  authorName: string | null
  authorFirstName: string | null
  authorLastName: string | null
  postCount: number
}

const buildAuthorSummaries = async (
  rows: AuthorAggregateRow[],
  viewerId?: string,
): Promise<BlogAuthorSummary[]> => {
  const db = getDb()
  const authorIds = rows.map(row => row.authorId).filter((id): id is string => Boolean(id))
  const followerCounts = new Map<string, number>()
  const followingIds = new Set<string>()

  if (authorIds.length) {
    const followerRows = await db.select({
      authorId: blogAuthorFollows.authorId,
      total: count(),
    })
      .from(blogAuthorFollows)
      .where(inArray(blogAuthorFollows.authorId, authorIds))
      .groupBy(blogAuthorFollows.authorId)

    for (const row of followerRows) {
      followerCounts.set(row.authorId, row.total)
    }

    if (viewerId) {
      const followRows = await db.select({ authorId: blogAuthorFollows.authorId })
        .from(blogAuthorFollows)
        .where(and(
          eq(blogAuthorFollows.followerId, viewerId),
          inArray(blogAuthorFollows.authorId, authorIds),
        ))

      for (const row of followRows) {
        followingIds.add(row.authorId)
      }
    }
  }

  return rows
    .filter(row => row.authorId)
    .map(row => ({
      id: row.authorId!,
      name: authorDisplayName(row),
      postCount: row.postCount,
      followerCount: followerCounts.get(row.authorId!) ?? 0,
      isFollowing: followingIds.has(row.authorId!) || undefined,
    }))
}

export const blogService = {
  searchPublished: async (params: BlogPostSearchParams = {}): Promise<BlogPostSearchResult> => {
    const db = getDb()
    const limit = params.limit ?? 24
    const offset = params.offset ?? 0
    const conditions = buildSearchConditions(params)

    if (params.followingUserId) {
      conditions.push(isNotNull(blogPosts.authorId))
    }

    const whereClause = and(...conditions)

    const buildBase = () => {
      let query = db.select({
        post: blogPosts,
        listingTitle: listings.title,
        listingCity: listings.city,
        authorName: users.name,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
        .from(blogPosts)
        .leftJoin(listings, eq(blogPosts.listingId, listings.id))
        .leftJoin(users, eq(blogPosts.authorId, users.id))

      if (params.followingUserId) {
        query = query.innerJoin(
          blogAuthorFollows,
          and(
            eq(blogAuthorFollows.authorId, blogPosts.authorId),
            eq(blogAuthorFollows.followerId, params.followingUserId!),
          ),
        )
      }

      return query
    }

    let countQuery = db.select({ total: count() })
      .from(blogPosts)
      .leftJoin(listings, eq(blogPosts.listingId, listings.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id))

    if (params.followingUserId) {
      countQuery = countQuery.innerJoin(
        blogAuthorFollows,
        and(
          eq(blogAuthorFollows.authorId, blogPosts.authorId),
          eq(blogAuthorFollows.followerId, params.followingUserId!),
        ),
      )
    }

    const [totalRow] = await countQuery.where(whereClause)

    const rows = await buildBase()
      .where(whereClause)
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      items: rows.map(row => mapCard(row.post, {
        listingTitle: row.listingTitle,
        listingCity: row.listingCity,
        authorName: row.post.authorId ? authorDisplayName(row) : null,
      })),
      total: totalRow?.total ?? 0,
    }
  },

  listPublished: async (limit = 50): Promise<BlogPostCard[]> => {
    const result = await blogService.searchPublished({ limit, offset: 0 })
    return result.items
  },

  listDistinctCities: async (): Promise<string[]> => {
    const db = getDb()
    const postCities = await db.selectDistinct({ city: blogPosts.city })
      .from(blogPosts)
      .where(and(eq(blogPosts.status, 'published'), sql`${blogPosts.city} IS NOT NULL AND ${blogPosts.city} <> ''`))

    const listingCities = await db.selectDistinct({ city: listings.city })
      .from(blogPosts)
      .innerJoin(listings, eq(blogPosts.listingId, listings.id))
      .where(eq(blogPosts.status, 'published'))

    const cities = new Set<string>()

    for (const row of postCities) {
      if (row.city) {
        cities.add(row.city)
      }
    }

    for (const row of listingCities) {
      if (row.city) {
        cities.add(row.city)
      }
    }

    return [...cities].sort((a, b) => a.localeCompare(b, 'ru'))
  },

  getPublishedBySlug: async (slug: string, viewerId?: string): Promise<BlogPost> => {
    const db = getDb()
    const [row] = await db.select({
      post: blogPosts,
      listingTitle: listings.title,
      listingCity: listings.city,
      authorName: users.name,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
    })
      .from(blogPosts)
      .leftJoin(listings, eq(blogPosts.listingId, listings.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published')))
      .limit(1)

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Blog post not found' })
    }

    let authorIsFollowing = false

    if (viewerId && row.post.authorId && viewerId !== row.post.authorId) {
      const [follow] = await db.select({ followerId: blogAuthorFollows.followerId })
        .from(blogAuthorFollows)
        .where(and(
          eq(blogAuthorFollows.followerId, viewerId),
          eq(blogAuthorFollows.authorId, row.post.authorId),
        ))
        .limit(1)

      authorIsFollowing = Boolean(follow)
    }

    return mapPost(row.post, {
      listingTitle: row.listingTitle,
      listingCity: row.listingCity,
      authorName: row.post.authorId ? authorDisplayName(row) : null,
      authorIsFollowing,
    })
  },

  getByIdForAuthor: async (id: string, authorId: string): Promise<BlogPost> => {
    const db = getDb()
    const [row] = await db.select({
      post: blogPosts,
      listingTitle: listings.title,
      listingCity: listings.city,
      authorName: users.name,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
    })
      .from(blogPosts)
      .leftJoin(listings, eq(blogPosts.listingId, listings.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(and(eq(blogPosts.id, id), eq(blogPosts.authorId, authorId)))
      .limit(1)

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Blog post not found' })
    }

    return mapPost(row.post, {
      listingTitle: row.listingTitle,
      listingCity: row.listingCity,
      authorName: authorDisplayName(row),
    })
  },

  listForListing: async (listingId: string, publishedOnly = false): Promise<BlogPostCard[]> => {
    const result = await blogService.searchPublished({
      listingId,
      limit: 50,
      offset: 0,
    })

    if (!publishedOnly) {
      const db = getDb()
      const rows = await db.select({
        post: blogPosts,
        listingTitle: listings.title,
        listingCity: listings.city,
        authorName: users.name,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
        .from(blogPosts)
        .leftJoin(listings, eq(blogPosts.listingId, listings.id))
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .where(eq(blogPosts.listingId, listingId))
        .orderBy(desc(blogPosts.updatedAt))

      return rows.map(row => mapCard(row.post, {
        listingTitle: row.listingTitle,
        listingCity: row.listingCity,
        authorName: row.post.authorId ? authorDisplayName(row) : null,
      }))
    }

    return result.items
  },

  listByAuthor: async (authorId: string, includeDrafts = false, viewerId?: string): Promise<BlogPostCard[]> => {
    const db = getDb()
    const conditions = [eq(blogPosts.authorId, authorId)]

    if (!includeDrafts) {
      conditions.push(eq(blogPosts.status, 'published'))
    } else if (viewerId !== authorId) {
      conditions.push(eq(blogPosts.status, 'published'))
    }

    const rows = await db.select({
      post: blogPosts,
      listingTitle: listings.title,
      listingCity: listings.city,
      authorName: users.name,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
    })
      .from(blogPosts)
      .leftJoin(listings, eq(blogPosts.listingId, listings.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(blogPosts.updatedAt))

    return rows.map(row => mapCard(row.post, {
      listingTitle: row.listingTitle,
      listingCity: row.listingCity,
      authorName: authorDisplayName(row),
    }))
  },

  listMyPosts: async (authorId: string): Promise<BlogPost[]> => {
    const db = getDb()
    const rows = await db.select({
      post: blogPosts,
      listingTitle: listings.title,
      listingCity: listings.city,
      authorName: users.name,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
    })
      .from(blogPosts)
      .leftJoin(listings, eq(blogPosts.listingId, listings.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.authorId, authorId))
      .orderBy(desc(blogPosts.updatedAt))

    return rows.map(row => mapPost(row.post, {
      listingTitle: row.listingTitle,
      listingCity: row.listingCity,
      authorName: authorDisplayName(row),
    }))
  },

  listAdmin: async (listingId?: string): Promise<BlogPost[]> => {
    const db = getDb()
    const rows = await db.select({
      post: blogPosts,
      listingTitle: listings.title,
      listingCity: listings.city,
      authorName: users.name,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
    })
      .from(blogPosts)
      .leftJoin(listings, eq(blogPosts.listingId, listings.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(listingId ? eq(blogPosts.listingId, listingId) : undefined)
      .orderBy(desc(blogPosts.updatedAt))

    return rows.map(row => mapPost(row.post, {
      listingTitle: row.listingTitle,
      listingCity: row.listingCity,
      authorName: row.post.authorId ? authorDisplayName(row) : null,
    }))
  },

  create: async (input: CreateBlogPostInput) => insertPost(input, null),

  createForUser: async (authorId: string, input: UserCreateBlogPostInput) =>
    insertPost(input, authorId),

  update: async (id: string, input: UpdateBlogPostInput, options?: { authorId?: string }) => {
    const db = getDb()
    const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1)

    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Blog post not found' })
    }

    if (options?.authorId && existing.authorId !== options.authorId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
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
    if (input.city !== undefined) {
      patch.city = input.city
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

    if (input.listingId && input.city === undefined && !existing.city) {
      const listing = await assertListingExists(input.listingId)
      patch.city = listing.city
    }

    const [row] = await db.update(blogPosts).set(patch).where(eq(blogPosts.id, id)).returning()
    return mapPost(row)
  },

  searchAuthors: async (q: string, limit = 12, viewerId?: string): Promise<BlogAuthorSummary[]> => {
    const db = getDb()
    const pattern = `%${q}%`

    const rows = await db.select({
      authorId: blogPosts.authorId,
      authorName: users.name,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
      postCount: count(blogPosts.id),
    })
      .from(blogPosts)
      .innerJoin(users, eq(blogPosts.authorId, users.id))
      .where(and(
        eq(blogPosts.status, 'published'),
        or(
          ilike(users.name, pattern),
          ilike(users.firstName, pattern),
          ilike(users.lastName, pattern),
        ),
      ))
      .groupBy(blogPosts.authorId, users.name, users.firstName, users.lastName)
      .orderBy(desc(count(blogPosts.id)))
      .limit(limit)

    return buildAuthorSummaries(rows, viewerId)
  },

  listPopularAuthors: async (limit = 8, viewerId?: string): Promise<BlogAuthorSummary[]> => {
    const db = getDb()

    const rows = await db.select({
      authorId: blogPosts.authorId,
      authorName: users.name,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
      postCount: count(blogPosts.id),
    })
      .from(blogPosts)
      .innerJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.status, 'published'))
      .groupBy(blogPosts.authorId, users.name, users.firstName, users.lastName)
      .orderBy(desc(count(blogPosts.id)))
      .limit(limit)

    return buildAuthorSummaries(rows, viewerId)
  },

  getAuthorProfile: async (authorId: string, viewerId?: string): Promise<BlogAuthorSummary> => {
    const db = getDb()
    const [userRow] = await db.select({
      id: users.id,
      authorName: users.name,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
    })
      .from(users)
      .where(eq(users.id, authorId))
      .limit(1)

    if (!userRow) {
      throw createError({ statusCode: 404, statusMessage: 'Author not found' })
    }

    const [postCountRow] = await db.select({ total: count() })
      .from(blogPosts)
      .where(and(eq(blogPosts.authorId, authorId), eq(blogPosts.status, 'published')))

    const [followerCountRow] = await db.select({ total: count() })
      .from(blogAuthorFollows)
      .where(eq(blogAuthorFollows.authorId, authorId))

    let isFollowing = false

    if (viewerId && viewerId !== authorId) {
      const [follow] = await db.select({ followerId: blogAuthorFollows.followerId })
        .from(blogAuthorFollows)
        .where(and(
          eq(blogAuthorFollows.followerId, viewerId),
          eq(blogAuthorFollows.authorId, authorId),
        ))
        .limit(1)

      isFollowing = Boolean(follow)
    }

    return {
      id: userRow.id,
      name: authorDisplayName(userRow),
      postCount: postCountRow?.total ?? 0,
      followerCount: followerCountRow?.total ?? 0,
      isFollowing,
    }
  },

  followAuthor: async (followerId: string, authorId: string) => {
    if (followerId === authorId) {
      throw createError({ statusCode: 400, statusMessage: 'Cannot follow yourself' })
    }

    const db = getDb()
    const [author] = await db.select({ id: users.id }).from(users).where(eq(users.id, authorId)).limit(1)

    if (!author) {
      throw createError({ statusCode: 404, statusMessage: 'Author not found' })
    }

    await db.insert(blogAuthorFollows).values({
      followerId,
      authorId,
    }).onConflictDoNothing()

    return { following: true }
  },

  unfollowAuthor: async (followerId: string, authorId: string) => {
    const db = getDb()

    await db.delete(blogAuthorFollows).where(and(
      eq(blogAuthorFollows.followerId, followerId),
      eq(blogAuthorFollows.authorId, authorId),
    ))

    return { following: false }
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
    const rows = await db.select({
      post: blogPosts,
      listingTitle: listings.title,
      listingCity: listings.city,
      authorName: users.name,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
    })
      .from(blogPosts)
      .leftJoin(listings, eq(blogPosts.listingId, listings.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(inArray(blogPosts.id, ids))

    for (const row of rows) {
      map.set(row.post.id, mapCard(row.post, {
        listingTitle: row.listingTitle,
        listingCity: row.listingCity,
        authorName: row.post.authorId ? authorDisplayName(row) : null,
      }))
    }

    return map
  },
}
