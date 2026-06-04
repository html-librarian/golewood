import type { BookingWithListing } from '#shared/types/booking'

export interface BookingGuestCardProps {
  booking: BookingWithListing
  locale: 'ru' | 'en'
  refundHint?: string | null
  reported?: boolean
  showReportForm?: boolean
  reportLoading?: boolean
}

export interface BookingGuestCardEmits {
  cancel: []
  reportToggle: []
  reportSubmit: [reason: string]
}
