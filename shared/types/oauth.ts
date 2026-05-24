export const OAUTH_PROVIDERS = ['yandex', 'vk'] as const
export type OAuthProvider = typeof OAUTH_PROVIDERS[number]

export interface OAuthProfile {
  providerUserId: string
  name: string | null
  /** VK / providers with separate given and family names (Western order in API). */
  firstName?: string | null
  lastName?: string | null
  email: string | null
}
