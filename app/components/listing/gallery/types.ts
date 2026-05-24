export interface ListingGalleryProps {
  photos: import('#shared/types/listing').ListingPhoto[]
  title: string
  /** carousel — hero + strip; mosaic — large tile + grid (listing page) */
  layout?: 'carousel' | 'mosaic'
}
