import type { ListingCard } from '#shared/types/listing'

export interface ListingFeaturedCarouselLabels {
  prev: string
  next: string
  pages: string
  goToPage: string
}

export interface ListingFeaturedCarouselProps {
  listings: ListingCard[]
  /** Карточек на один экран карусели */
  perPage?: number
  /** Интервал автоскролла (мс) */
  autoplayMs?: number
  labels: ListingFeaturedCarouselLabels
}
