import { scaleSettlementForCashDue } from '#shared/utils/booking-settlement'
import type { YookassaTransferInput } from './yookassa'
import { formatYookassaAmount } from './yookassa'

export interface BookingPaymentSplitInput {
  bookingId: string
  hostAmount: number
  platformFee: number
  totalPrice: number
  cashDue: number
  yookassaRecipientId: string
  hostLegalName?: string | null
}

export const buildBookingPaymentSplit = (input: BookingPaymentSplitInput) => {
  const { hostAmount, platformFee } = scaleSettlementForCashDue(
    input.hostAmount,
    input.platformFee,
    input.totalPrice,
    input.cashDue,
  )

  if (hostAmount + platformFee !== input.cashDue) {
    throw createError({ statusCode: 500, statusMessage: 'Invalid payment split' })
  }

  const hostLabel = input.hostLegalName?.trim() || 'Хозяин'
  const description = `Бронь ${input.bookingId}: ${hostLabel} ${hostAmount} ₽`

  const transfers: YookassaTransferInput[] = [{
    account_id: input.yookassaRecipientId,
    amount: formatYookassaAmount(hostAmount),
    platform_fee_amount: formatYookassaAmount(platformFee),
    description: `Бронь ${input.bookingId}`,
    metadata: { bookingId: input.bookingId },
  }]

  return {
    hostAmount,
    platformFee,
    description,
    transfers,
  }
}
