/** Доля стоимости брони, которую можно оплатить бонусами (0–100). */
export const BONUS_MAX_BOOKING_PERCENT = 30

/** Минимальная оплата картой при ненулевой сумме брони (₽). */
export const BONUS_MIN_CASH_PAYMENT = 100

/** Процент от суммы брони, начисляемый за опубликованный отзыв. */
export const BONUS_REVIEW_REWARD_PERCENT = 5

/** Максимум бонусов за один отзыв (₽). */
export const BONUS_REVIEW_REWARD_MAX = 2000

export const getBookingCashDue = (totalPrice: number, bonusApplied: number) =>
  Math.max(0, totalPrice - bonusApplied)

export const getMaxBonusForBooking = (totalPrice: number, userBalance: number) => {
  if (totalPrice <= 0 || userBalance <= 0) {
    return 0
  }

  if (totalPrice <= BONUS_MIN_CASH_PAYMENT) {
    return Math.min(userBalance, totalPrice)
  }

  const byPercent = Math.floor(totalPrice * BONUS_MAX_BOOKING_PERCENT / 100)
  const maxByCashRule = totalPrice > BONUS_MIN_CASH_PAYMENT
    ? totalPrice - BONUS_MIN_CASH_PAYMENT
    : totalPrice

  return Math.min(userBalance, byPercent, maxByCashRule, totalPrice)
}

export const clampBonusToApply = (totalPrice: number, userBalance: number, requested: number) => {
  const safeRequested = Math.max(0, Math.floor(requested))
  const maxAllowed = getMaxBonusForBooking(totalPrice, userBalance)
  return Math.min(safeRequested, maxAllowed)
}

export const calculateReviewBonusReward = (bookingTotalPrice: number) => {
  const raw = Math.floor(bookingTotalPrice * BONUS_REVIEW_REWARD_PERCENT / 100)
  return Math.min(BONUS_REVIEW_REWARD_MAX, Math.max(0, raw))
}
