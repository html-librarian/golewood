import type { HostVerificationPublic } from '#shared/types/host-verification'

export interface HostVerifiedBadgeProps {
  verification: HostVerificationPublic
  showInfoLink?: boolean
}

export interface HostVerifiedBadgeEmits {
  openDetails: []
}
