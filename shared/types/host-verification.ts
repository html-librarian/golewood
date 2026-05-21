export const HOST_LEGAL_TYPES = ['company', 'individual'] as const
export type HostLegalType = typeof HOST_LEGAL_TYPES[number]

export interface HostLegalDetails {
  legalType: HostLegalType
  legalName: string
  inn: string
  ogrn: string | null
  legalAddress: string
  workingHoursNote: string
}

export interface HostVerificationPublic {
  isVerified: boolean
  badgeLabel: { ru: string, en: string }
  legal: HostLegalDetails | null
}

export interface HostLegalProfileAdmin extends HostLegalDetails {
  userId: string
  isVerified: boolean
  verifiedAt: string | null
}

export const HOST_VERIFICATION_BADGE_LABELS: Record<HostLegalType, { ru: string, en: string }> = {
  company: { ru: 'Компания проверена', en: 'Verified company' },
  individual: { ru: 'Хост проверен', en: 'Verified host' },
}
