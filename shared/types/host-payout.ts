export const HOST_PAYOUT_STATUSES = [
  'not_started',
  'pending',
  'active',
  'rejected',
] as const

export type HostPayoutStatus = typeof HOST_PAYOUT_STATUSES[number]

export interface HostPayoutProfile {
  userId: string
  status: HostPayoutStatus
  inn: string | null
  bankAccount: string | null
  bik: string | null
  yookassaRecipientId: string | null
  rejectionReason: string | null
  submittedAt: string | null
  activatedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminHostPayoutQueueItem extends HostPayoutProfile {
  userName: string | null
  userPhone: string | null
}

export const HOST_PAYOUT_STATUS_LABELS: Record<HostPayoutStatus, { ru: string, en: string }> = {
  not_started: { ru: 'Не подключено', en: 'Not connected' },
  pending: { ru: 'На проверке', en: 'Under review' },
  active: { ru: 'Выплаты подключены', en: 'Payouts active' },
  rejected: { ru: 'Отклонено', en: 'Rejected' },
}
