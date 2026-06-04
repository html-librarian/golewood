import { z } from 'zod'
import { BLOG_POST_STATUSES } from '#shared/types/blog'

const blogPostFieldsSchema = z.object({
  titleRu: z.string().trim().min(3).max(255),
  titleEn: z.string().trim().min(3).max(255).optional(),
  excerptRu: z.string().trim().max(500).default(''),
  excerptEn: z.string().trim().max(500).optional(),
  bodyRu: z.string().trim().min(20).max(100_000),
  bodyEn: z.string().trim().max(100_000).optional(),
  coverImageUrl: z.string().trim().url().max(512).optional().nullable(),
  listingId: z.string().uuid().optional().nullable(),
  city: z.string().trim().min(1).max(128).optional().nullable(),
  status: z.enum(BLOG_POST_STATUSES).default('draft'),
  slug: z.string().trim().min(2).max(128).regex(/^[a-z0-9-]+$/).optional(),
})

export const createBlogPostSchema = blogPostFieldsSchema.extend({
  listingId: z.string().uuid(),
})

export const userCreateBlogPostSchema = blogPostFieldsSchema

export const updateBlogPostSchema = blogPostFieldsSchema.partial()

export const blogPostSearchQuerySchema = z.object({
  authorId: z.string().uuid().optional(),
  listingId: z.string().uuid().optional(),
  city: z.string().trim().min(1).max(128).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  authorQ: z.string().trim().min(1).max(80).optional(),
  following: z.enum(['1', 'true']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(24),
})

export const blogAuthorSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(80),
  limit: z.coerce.number().int().min(1).max(30).default(12),
})

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>
export type UserCreateBlogPostInput = z.infer<typeof userCreateBlogPostSchema>
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>
export type BlogPostSearchQuery = z.infer<typeof blogPostSearchQuerySchema>
