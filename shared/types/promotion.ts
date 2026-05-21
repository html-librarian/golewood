export const PROMOTION_PRODUCT_SLUGS = ['highlight', 'boost', 'city_pin'] as const
export type PromotionProductSlug = typeof PROMOTION_PRODUCT_SLUGS[number]

export interface PromotionProduct {
  slug: PromotionProductSlug
  titleRu: string
  titleEn: string
  descriptionRu: string
  descriptionEn: string
  pricePoints: number
  durationDays: number
}

export interface ListingPromotion {
  id: string
  listingId: string
  hostId: string
  productSlug: PromotionProductSlug
  pricePoints: number
  startsAt: string
  endsAt: string
  createdAt: string
}

export interface ListingPromotionMeta {
  highlight: boolean
  boost: boolean
  /** Закрепление в топе выдачи по городу объявления */
  cityPin: boolean
}

export const HOST_PROMO_TRANSACTION_TYPES = [
  'booking_reward',
  'promotion_purchase',
  'points_purchase',
  'refund',
  'admin_adjust',
] as const
export type HostPromoTransactionType = typeof HOST_PROMO_TRANSACTION_TYPES[number]

export interface HostPromoTransaction {
  id: string
  userId: string
  amount: number
  type: HostPromoTransactionType
  listingId: string | null
  promotionId: string | null
  balanceAfter: number
  createdAt: string
}

export interface HostPromoPointPackage {
  slug: string
  points: number
  priceRub: number
  titleRu: string
  titleEn: string
  descriptionRu: string
  descriptionEn: string
}

export interface HostPromoPurchase {
  id: string
  userId: string
  packageSlug: string
  points: number
  amountRub: number
  status: 'pending' | 'succeeded' | 'cancelled'
  confirmationUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface HostPromoAccountSummary {
  balance: number
  transactions: HostPromoTransaction[]
  products: PromotionProduct[]
  pointPackages: HostPromoPointPackage[]
}

export const HOST_PROMO_TRANSACTION_LABELS: Record<HostPromoTransactionType, { ru: string, en: string }> = {
  booking_reward: { ru: 'Бонус за бронирование', en: 'Booking reward' },
  promotion_purchase: { ru: 'Продвижение объявления', en: 'Listing promotion' },
  points_purchase: { ru: 'Покупка баллов', en: 'Points purchase' },
  refund: { ru: 'Возврат', en: 'Refund' },
  admin_adjust: { ru: 'Корректировка', en: 'Adjustment' },
}
