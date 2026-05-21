import type { ListingDocument, ListingPhoto } from '#shared/types/listing'

export interface ListingMediaUploaderProps {
  listingId: string
  photos: ListingPhoto[]
  documents: ListingDocument[]
  loading?: boolean
}

export interface ListingMediaUploaderEmits {
  'update:photos': [photos: ListingPhoto[]]
  'update:documents': [documents: ListingDocument[]]
}
