import type { ListingNewsItem } from '#shared/types/listing-news'

export interface ListingNewsCardProps {
  item: ListingNewsItem
  listingId: string
  listingTitle?: string
}
