import type { HostVerificationPublic } from '#shared/types/host-verification'

export interface HostVerificationModalProps {
  open: boolean
  verification: HostVerificationPublic
}

export interface HostVerificationModalEmits {
  'update:open': [value: boolean]
}
