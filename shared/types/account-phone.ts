export interface PhoneChangeStatus {
  requiresCurrentPhoneVerification: boolean
  currentPhoneVerified: boolean
  maskedCurrentPhone: string | null
}
