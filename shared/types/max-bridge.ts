import type { AuthSession } from '#shared/types/user'

export interface MaxBridgeUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string | null
  language_code?: string
  photo_url?: string | null
}

export interface MaxInitDataParsed {
  queryId: string | null
  authDate: number
  maxUserId: number
  startParam: string | null
  user: MaxBridgeUser
}

export interface MaxBridgeNeedsLink {
  needsLink: true
  maxUserId: number
  startParam: string | null
  botUsername: string | null
  accountUrl: string
}

export interface MaxBridgeLinked {
  linked: true
  maxUserId: number
}

export type MaxBridgeAuthResult = AuthSession | MaxBridgeNeedsLink | MaxBridgeLinked
