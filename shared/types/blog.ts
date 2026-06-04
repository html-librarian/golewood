export const BLOG_POST_STATUSES = ['draft', 'published'] as const
export type BlogPostStatus = typeof BLOG_POST_STATUSES[number]

export interface BlogAuthorSummary {
  id: string
  name: string | null
  postCount: number
  followerCount: number
  isFollowing?: boolean
}

export interface BlogPostCard {
  id: string
  slug: string
  titleRu: string
  titleEn: string
  excerptRu: string
  excerptEn: string
  coverImageUrl: string | null
  listingId: string | null
  authorId: string | null
  authorName: string | null
  city: string | null
  listingTitle?: string | null
  listingCity?: string | null
  publishedAt: string | null
}

export interface BlogPost extends BlogPostCard {
  bodyRu: string
  bodyEn: string
  status: BlogPostStatus
  createdAt: string
  updatedAt: string
  authorIsFollowing?: boolean
}

export interface BlogPostSearchParams {
  authorId?: string
  listingId?: string
  city?: string
  q?: string
  authorQ?: string
  followingUserId?: string
  limit?: number
  offset?: number
}

export interface BlogPostSearchResult {
  items: BlogPostCard[]
  total: number
}
