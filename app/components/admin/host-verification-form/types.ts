import type { HostLegalProfileAdmin } from '#shared/types/host-verification'

export interface AdminHostVerificationFormProps {
  userId: string
  initial?: HostLegalProfileAdmin | null
}
