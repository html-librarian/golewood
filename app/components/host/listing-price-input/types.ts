import type { ListingPriceInputMode } from '#shared/utils/listing-price-preview'

export interface HostListingPriceInputProps {
  labelHostNet: string
  labelGuestTotal: string
  modeHostNet: string
  modeGuestTotal: string
  feeHintHostNet: string
  feeHintGuestTotal: string
  hostReceivesLabel: string
  guestPaysLabel: string
}

export interface HostListingPriceInputEmits {
  'update:mode': [mode: ListingPriceInputMode]
}
