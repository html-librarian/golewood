import type { ChartSeriesPoint } from './chart'

/** Суммы в рублях за всё время и за последние 30 дней. */
export type AdminMoneyPeriod = {
  allTimeRub: number
  last30DaysRub: number
}

/** Очереди модерации и поддержки. */
export type AdminQueueStats = {
  users: number
  listingsModeration: number
  listingsArchived: number
  reviewsPending: number
  reportsOpen: number
  claimsPending: number
}

/** Объём платформы (брони, объявления, пользователи). */
export type AdminPlatformVolume = {
  hosts: number
  guests: number
  listingsPublished: number
  bookingsTotal: number
  bookingsPaid: number
  bookingsLast30Days: number
}

export type AdminRevenueStats = {
  /** Комиссия 10% с оплаченных броней (platform_fee). */
  bookingCommission: AdminMoneyPeriod
  /** Покупка баллов продвижения хостами (100% платформе). */
  promoPointsSales: AdminMoneyPeriod
  /** Комиссия 10% с оплаченных подарочных сертификатов (platform_fee). */
  giftCertificates: AdminMoneyPeriod
  /** Сумма bookingCommission + promoPointsSales (+ сертификаты позже). */
  totalNet: AdminMoneyPeriod
}

export type AdminDashboardCharts = {
  bookingsByDay: ChartSeriesPoint[]
  revenueCommissionByDay: ChartSeriesPoint[]
  revenuePromoByDay: ChartSeriesPoint[]
  revenueGiftCertificatesByDay: ChartSeriesPoint[]
}

export type AdminDashboardStats = {
  queue: AdminQueueStats
  platform: AdminPlatformVolume
  revenue: AdminRevenueStats
  charts: AdminDashboardCharts
}

/** @deprecated Используйте AdminDashboardStats.queue */
export type AdminStats = AdminQueueStats
