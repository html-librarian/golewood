import type { ListingNewsItem, ListingNewsReaction } from '#shared/types/listing-news'

export interface ListingNewsReactionsProps {
  listingId: string
  newsId: string
  likesCount: number
  dislikesCount: number
  userReaction?: ListingNewsReaction | null
}

export interface ListingNewsReactionsEmits {
  updated: [payload: Pick<ListingNewsItem, 'likesCount' | 'dislikesCount' | 'userReaction'>]
}
