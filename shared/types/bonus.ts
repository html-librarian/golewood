export const BONUS_TRANSACTION_TYPES = ['review_reward', 'booking_payment', 'booking_refund'] as const
export type BonusTransactionType = typeof BONUS_TRANSACTION_TYPES[number]

export interface BonusTransaction {
  id: string
  userId: string
  amount: number
  type: BonusTransactionType
  bookingId: string | null
  reviewId: string | null
  balanceAfter: number
  createdAt: string
}

export interface BonusAccountSummary {
  balance: number
  transactions: BonusTransaction[]
  rules: {
    maxBookingPercent: number
    minCashPayment: number
    reviewRewardPercent: number
    reviewRewardMax: number
  }
}

export const BONUS_TRANSACTION_LABELS: Record<BonusTransactionType, { ru: string, en: string }> = {
  review_reward: { ru: 'Бонусы за отзыв', en: 'Review reward' },
  booking_payment: { ru: 'Оплата бронирования', en: 'Booking payment' },
  booking_refund: { ru: 'Возврат при отмене', en: 'Cancellation refund' },
}
