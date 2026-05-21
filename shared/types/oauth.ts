export const OAUTH_PROVIDERS = ['yandex', 'vk'] as const
export type OAuthProvider = typeof OAUTH_PROVIDERS[number]

export interface OAuthProfile {
  providerUserId: string
  name: string | null
  email: string | null
}
