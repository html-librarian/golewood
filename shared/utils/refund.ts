import type { CancellationPolicy } from '#shared/types/listing'
import { parseDate } from './dates'

const MS_PER_HOUR = 60 * 60 * 1000

export interface RefundCalculation {
  refundAmount: number
  refundPercent: number
}

export const calculateRefund = (
  totalPrice: number,
  policy: CancellationPolicy,
  checkIn: string,
  cancelledAt: Date = new Date(),
): RefundCalculation => {
  const checkInTime = parseDate(checkIn).getTime()
  const hoursUntilCheckIn = (checkInTime - cancelledAt.getTime()) / MS_PER_HOUR

  let refundPercent = 0

  if (policy === 'flexible' && hoursUntilCheckIn >= 24) {
    refundPercent = 100
  } else if (policy === 'moderate' && hoursUntilCheckIn >= 5 * 24) {
    refundPercent = 100
  } else if (policy === 'strict' && hoursUntilCheckIn >= 7 * 24) {
    refundPercent = 50
  }

  const refundAmount = Math.round(totalPrice * refundPercent / 100)

  return { refundAmount, refundPercent }
}
