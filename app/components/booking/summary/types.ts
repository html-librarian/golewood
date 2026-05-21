export interface BookingSummaryProps {
  listingId: string
  pricePerNight: number
  checkIn: string
  checkOut: string
  guests: number
  /** Included in nightly rate without surcharge */
  maxGuestsIncluded?: number
  /** Hard cap for guest stepper */
  maxGuests?: number
  extraGuestsOffered?: boolean
  extraGuestPricePerNight?: number | null
  loading?: boolean
  transferOffered?: boolean
  transferPrice?: number | null
  transferPriceOnRequest?: boolean
  includeTransfer?: boolean
  bonusBalance?: number
  bonusToApply?: number
  showGiftCertificate?: boolean
  giftCertificateCode?: string
  giftCertificateCredit?: number
}

export interface BookingSummaryEmits {
  'update:guests': [value: number]
  'update:includeTransfer': [value: boolean]
  'update:bonusToApply': [value: number]
  'update:giftCertificateCode': [value: string]
  'update:giftCertificateCredit': [value: number]
  book: []
}
