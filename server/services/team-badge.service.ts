import { badgeSlugRequiresBlogPost } from '#shared/catalog/team-badges'
import type { BlogPostCard } from '#shared/types/blog'
import type { TeamBadge } from '#shared/types/team-badge'
import type {
  AssignListingTeamBadgeInput,
  CreateTeamBadgeInput,
  UpdateTeamBadgeInput,
} from '#shared/schemas/team-badge'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { blogPosts, listings, teamBadgeCatalog } from '../db/schema'
import { getDb } from '../utils/db'
import { blogService } from './blog.service'

export const mapTeamBadge = (row: typeof teamBadgeCatalog.$inferSelect): TeamBadge => ({
  id: row.id,
  slug: row.slug,
  icon: row.icon,
  titleRu: row.titleRu,
  titleEn: row.titleEn,
  descriptionRu: row.descriptionRu,
  descriptionEn: row.descriptionEn,
  requiresBlogPost: row.requiresBlogPost || badgeSlugRequiresBlogPost(row.slug),
  active: row.active,
  sortOrder: row.sortOrder,
})

export const teamBadgeService = {
  list: async (activeOnly = true): Promise<TeamBadge[]> => {
    const db = getDb()
    const rows = await db.select().from(teamBadgeCatalog)
      .where(activeOnly ? eq(teamBadgeCatalog.active, true) : undefined)
      .orderBy(asc(teamBadgeCatalog.sortOrder), asc(teamBadgeCatalog.titleRu))

    return rows.map(mapTeamBadge)
  },

  create: async (input: CreateTeamBadgeInput) => {
    const db = getDb()
    const [row] = await db.insert(teamBadgeCatalog).values({
      slug: input.slug,
      icon: input.icon,
      titleRu: input.titleRu,
      titleEn: input.titleEn,
      descriptionRu: input.descriptionRu,
      descriptionEn: input.descriptionEn,
      requiresBlogPost: badgeSlugRequiresBlogPost(input.slug),
      active: input.active,
      sortOrder: input.sortOrder,
    }).returning()

    return mapTeamBadge(row)
  },

  update: async (id: string, input: UpdateTeamBadgeInput) => {
    const db = getDb()
    const patch: Partial<typeof teamBadgeCatalog.$inferInsert> = { ...input }

    if (input.slug !== undefined) {
      patch.requiresBlogPost = badgeSlugRequiresBlogPost(input.slug)
    }

    const [row] = await db.update(teamBadgeCatalog).set(patch).where(eq(teamBadgeCatalog.id, id)).returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Team badge not found' })
    }

    return mapTeamBadge(row)
  },

  assertActiveBadgeId: async (teamBadgeId: string) => {
    const db = getDb()
    const [row] = await db.select().from(teamBadgeCatalog)
      .where(and(eq(teamBadgeCatalog.id, teamBadgeId), eq(teamBadgeCatalog.active, true)))
      .limit(1)

    if (!row) {
      throw createError({ statusCode: 400, statusMessage: 'Team badge is not available' })
    }

    return mapTeamBadge(row)
  },

  assignToListing: async (listingId: string, input: AssignListingTeamBadgeInput) => {
    const db = getDb()
    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)

    if (!listing) {
      throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
    }

    if (!input.teamBadgeId) {
      await db.update(listings)
        .set({ teamBadgeId: null, teamBadgeBlogPostId: null, updatedAt: new Date() })
        .where(eq(listings.id, listingId))

      return teamBadgeService.buildAssignResult(listingId)
    }

    const badge = await teamBadgeService.assertActiveBadgeId(input.teamBadgeId)

    let blogPostId: string | null = null

    if (badge.requiresBlogPost) {
      if (!input.blogPostId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'A published blog post link is required for this team badge',
        })
      }

      await blogService.assertPublishedForListing(input.blogPostId, listingId)
      blogPostId = input.blogPostId
    } else if (input.blogPostId) {
      blogPostId = input.blogPostId
    }

    await db.update(listings)
      .set({
        teamBadgeId: input.teamBadgeId,
        teamBadgeBlogPostId: blogPostId,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listingId))

    return teamBadgeService.buildAssignResult(listingId)
  },

  buildAssignResult: async (listingId: string) => {
    const badgeMap = await teamBadgeService.getBadgesForListingIds([listingId])
    const blogMap = await teamBadgeService.getBlogPostsForListingIds([listingId])

    return {
      listingId,
      teamBadge: badgeMap.get(listingId) ?? null,
      teamBadgeBlogPost: blogMap.get(listingId) ?? null,
    }
  },

  getBadgesForListingIds: async (listingIds: string[]) => {
    const map = new Map<string, TeamBadge>()

    if (!listingIds.length) {
      return map
    }

    const db = getDb()
    const rows = await db.select({
      listingId: listings.id,
      badge: teamBadgeCatalog,
    })
      .from(listings)
      .innerJoin(teamBadgeCatalog, eq(listings.teamBadgeId, teamBadgeCatalog.id))
      .where(and(
        inArray(listings.id, listingIds),
        eq(teamBadgeCatalog.active, true),
      ))

    for (const row of rows) {
      map.set(row.listingId, mapTeamBadge(row.badge))
    }

    return map
  },

  getBlogPostsForListingIds: async (listingIds: string[]) => {
    const map = new Map<string, BlogPostCard>()

    if (!listingIds.length) {
      return map
    }

    const db = getDb()
    const rows = await db.select({
      listingId: listings.id,
      post: blogPosts,
    })
      .from(listings)
      .innerJoin(blogPosts, eq(listings.teamBadgeBlogPostId, blogPosts.id))
      .where(and(
        inArray(listings.id, listingIds),
        eq(blogPosts.status, 'published'),
      ))

    for (const row of rows) {
      map.set(row.listingId, {
        id: row.post.id,
        slug: row.post.slug,
        titleRu: row.post.titleRu,
        titleEn: row.post.titleEn,
        excerptRu: row.post.excerptRu,
        excerptEn: row.post.excerptEn,
        coverImageUrl: row.post.coverImageUrl,
        listingId: row.post.listingId,
        publishedAt: row.post.publishedAt?.toISOString() ?? null,
      })
    }

    return map
  },

  attachToListings: async <T extends { id: string }>(items: T[]) => {
    const ids = items.map(item => item.id)
    const badgeMap = await teamBadgeService.getBadgesForListingIds(ids)
    const blogMap = await teamBadgeService.getBlogPostsForListingIds(ids)

    return items.map(item => ({
      ...item,
      teamBadge: badgeMap.get(item.id) ?? null,
      teamBadgeBlogPost: blogMap.get(item.id) ?? null,
    }))
  },
}
