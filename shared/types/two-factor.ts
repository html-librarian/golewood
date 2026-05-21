import type { AuthSession } from './user'

export interface TwoFactorStatus {
  enabled: boolean
  canEnable: boolean
  maskedEmail: string | null
}

export interface MfaChallenge {
  mfaRequired: true
  challengeToken: string
  maskedEmail: string
  expiresIn: number
  devCode?: string
}

export type LoginResult = AuthSession | MfaChallenge

export const isMfaChallenge = (result: LoginResult): result is MfaChallenge =>
  'mfaRequired' in result && result.mfaRequired === true
