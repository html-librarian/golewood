import type { Payment } from './payment'
import type { CancellationPolicy } from './listing'

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'] as const
export type BookingStatus = typeof BOOKING_STATUSES[number]

export interface Booking {
  id: string
  listingId: string
  guestId: string
  checkIn: string
  checkOut: string
  guests: number
  totalPrice: number
  /** Сумма к зачислению хозяину при сплите (без сервисного сбора). */
  hostAmount: number
  /** Сервисный сбор платформы (10% от базы проживания). */
  platformFee: number
  bonusApplied: number
  /** Списано по подарочному сертификату при создании брони (₽). */
  giftCertificateCredit: number
  transferRequested: boolean
  transferPrice: number
  status: BookingStatus
  createdAt: string
  updatedAt: string
}

export interface BookingWithListing extends Booking {
  listing: {
    id: string
    title: string
    city: string
    coverPhotoUrl: string | null
    cancellationPolicy: CancellationPolicy
  }
  payment?: Payment | null
  refundPreview?: { amount: number, percent: number } | null
  /** Можно оставить отзыв (завершённая бронь без отзыва) */
  canReview?: boolean
}

export type CalendarUnavailableReason = 'past' | 'booking' | 'import' | 'manual'

export interface CalendarDay {
  date: string
  available: boolean
  price: number | null
  minNights: number | null
  /** Заполняется в host-календаре для клика по сетке */
  unavailableReason?: CalendarUnavailableReason | null
  manualBlockId?: string | null
}

export interface ListingBlock {
  id: string
  listingId: string
  startDate: string
  endDate: string
  source: 'manual' | 'import'
  feedId: string | null
  feedLabel: string | null
  createdAt: string
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, { ru: string, en: string }> = {
  pending: { ru: 'Ожидает подтверждения', en: 'Pending' },
  confirmed: { ru: 'Подтверждено', en: 'Confirmed' },
  cancelled: { ru: 'Отменено', en: 'Cancelled' },
  completed: { ru: 'Завершено', en: 'Completed' },
}
