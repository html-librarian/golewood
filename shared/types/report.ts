export const REPORT_STATUSES = ['open', 'in_progress', 'resolved', 'dismissed'] as const
export type ReportStatus = typeof REPORT_STATUSES[number]

export const REPORT_TYPES = ['listing', 'booking', 'user', 'other'] as const
export type ReportType = typeof REPORT_TYPES[number]

export interface Report {
  id: string
  reporterId: string
  type: ReportType
  listingId: string | null
  bookingId: string | null
  targetUserId: string | null
  reason: string
  status: ReportStatus
  adminNote: string
  createdAt: string
  updatedAt: string
}

export interface ReportWithDetails extends Report {
  reporterName: string | null
  reporterPhone: string
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, { ru: string, en: string }> = {
  open: { ru: 'Открыта', en: 'Open' },
  in_progress: { ru: 'В работе', en: 'In progress' },
  resolved: { ru: 'Решена', en: 'Resolved' },
  dismissed: { ru: 'Отклонена', en: 'Dismissed' },
}

export const REPORT_TYPE_LABELS: Record<ReportType, { ru: string, en: string }> = {
  listing: { ru: 'Объявление', en: 'Listing' },
  booking: { ru: 'Бронирование', en: 'Booking' },
  user: { ru: 'Пользователь', en: 'User' },
  other: { ru: 'Другое', en: 'Other' },
}
