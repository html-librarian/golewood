export interface ListingCardProps {
  listing: import('#shared/types/listing').ListingCard
  /** Static preview in host wizard — no navigation. */
  preview?: boolean
  /** Override price shown on the card (e.g. guest total incl. service fee). */
  displayPricePerNight?: number
}
