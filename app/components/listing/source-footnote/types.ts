import type { Listing } from '#shared/types/listing'

export interface ListingSourceFootnoteProps {
  listing: Pick<Listing, 'sourceAttributionRu' | 'sourceAttributionEn'>
}
