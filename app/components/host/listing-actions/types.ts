import type { ListingStatus } from '#shared/types/listing'

export interface HostListingActionsProps {
  listingId: string
  status: ListingStatus
  archiving?: boolean
  restoring?: boolean
}

export interface HostListingActionsEmits {
  archive: []
  restore: []
}
