export interface ListingBookingBarProps {
  pricePerNight: number
  checkIn: string
  checkOut: string
  guests: number
  loading?: boolean
  transferOffered?: boolean
  transferPrice?: number | null
  transferPriceOnRequest?: boolean
  includeTransfer?: boolean
}

export interface ListingBookingBarEmits {
  book: []
  'scroll-to-panel': []
}
