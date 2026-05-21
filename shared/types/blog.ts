export const BLOG_POST_STATUSES = ['draft', 'published'] as const
export type BlogPostStatus = typeof BLOG_POST_STATUSES[number]

export interface BlogPostCard {
  id: string
  slug: string
  titleRu: string
  titleEn: string
  excerptRu: string
  excerptEn: string
  coverImageUrl: string | null
  listingId: string | null
  publishedAt: string | null
}

export interface BlogPost extends BlogPostCard {
  bodyRu: string
  bodyEn: string
  status: BlogPostStatus
  listingTitle?: string | null
  listingCity?: string | null
  createdAt: string
  updatedAt: string
}
