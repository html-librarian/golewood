export const PAYMENT_STATUSES = [
  'pending',
  'waiting_for_capture',
  'succeeded',
  'cancelled',
  'refunded',
] as const

export type PaymentStatus = typeof PAYMENT_STATUSES[number]

export interface Payment {
  id: string
  bookingId: string
  yookassaPaymentId: string | null
  amount: number
  currency: string
  status: PaymentStatus
  confirmationUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentResult {
  payment: Payment
  confirmationUrl: string
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { ru: string, en: string }> = {
  pending: { ru: 'Ожидает оплаты', en: 'Awaiting payment' },
  waiting_for_capture: { ru: 'Оплачено (холд)', en: 'Paid (hold)' },
  succeeded: { ru: 'Оплачено', en: 'Paid' },
  cancelled: { ru: 'Отменено', en: 'Cancelled' },
  refunded: { ru: 'Возвращено', en: 'Refunded' },
}

export const isPaymentPaid = (status: PaymentStatus) =>
  ['waiting_for_capture', 'succeeded'].includes(status)
