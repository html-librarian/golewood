import { z } from 'zod'
import { BLOG_POST_STATUSES } from '#shared/types/blog'
import { LISTING_NEWS_REACTIONS } from '#shared/types/listing-news'

export const createListingNewsSchema = z.object({
  title: z.string().trim().min(3).max(255),
  body: z.string().trim().min(10).max(50_000),
  excerpt: z.string().trim().min(10).max(500),
  showBookingButton: z.boolean().default(false),
  status: z.enum(BLOG_POST_STATUSES).default('draft'),
})

export const updateListingNewsSchema = createListingNewsSchema.partial()

export const listingNewsReactionSchema = z.object({
  reaction: z.enum(LISTING_NEWS_REACTIONS),
})

export type CreateListingNewsInput = z.infer<typeof createListingNewsSchema>
export type UpdateListingNewsInput = z.infer<typeof updateListingNewsSchema>
export type ListingNewsReactionInput = z.infer<typeof listingNewsReactionSchema>
