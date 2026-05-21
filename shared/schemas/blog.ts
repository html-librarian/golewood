import { z } from 'zod'
import { BLOG_POST_STATUSES } from '#shared/types/blog'

export const createBlogPostSchema = z.object({
  titleRu: z.string().trim().min(3).max(255),
  titleEn: z.string().trim().min(3).max(255).optional(),
  excerptRu: z.string().trim().max(500).default(''),
  excerptEn: z.string().trim().max(500).optional(),
  bodyRu: z.string().trim().min(20).max(100_000),
  bodyEn: z.string().trim().max(100_000).optional(),
  coverImageUrl: z.string().trim().url().max(512).optional().nullable(),
  listingId: z.string().uuid(),
  status: z.enum(BLOG_POST_STATUSES).default('draft'),
  slug: z.string().trim().min(2).max(128).regex(/^[a-z0-9-]+$/).optional(),
})

export const updateBlogPostSchema = createBlogPostSchema.partial()

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>
