import type { BlogPostStatus } from './blog'

export const LISTING_NEWS_REACTIONS = ['like', 'dislike'] as const
export type ListingNewsReaction = typeof LISTING_NEWS_REACTIONS[number]

export type ListingNewsMediaType = 'photo' | 'video'

export interface ListingNewsMedia {
  id: string
  newsId: string
  url: string
  mediaType: ListingNewsMediaType
  embedUrl: string | null
  provider: string | null
  sortOrder: number
}

export interface ListingNewsItem {
  id: string
  listingId: string
  title: string
  /** Полное описание */
  body: string
  /** Краткое описание для карточки */
  excerpt: string
  previewImageUrl: string | null
  showBookingButton: boolean
  likesCount: number
  dislikesCount: number
  status: BlogPostStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  media?: ListingNewsMedia[]
  userReaction?: ListingNewsReaction | null
}

export interface ListingNewsCardMeta {
  hostNewsCount: number
  latestHostNewsTitle: string | null
  latestHostNewsExcerpt: string | null
  latestHostNewsAt: string | null
  latestHostNewsPreviewUrl: string | null
  teamReviewExcerptRu: string | null
  teamReviewExcerptEn: string | null
}
