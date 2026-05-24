export const USER_ROLES = ['guest', 'host', 'admin', 'support', 'content_manager'] as const
export type UserRole = typeof USER_ROLES[number]

export interface User {
  id: string
  phone: string
  email: string | null
  /** Denormalized «Фамилия Имя Отчество» for display and legacy clients. */
  name: string | null
  lastName: string | null
  firstName: string | null
  patronymic: string | null
  /** Preferred city for search and home discovery (catalog name, e.g. «Сочи»). */
  homeCity: string | null
  role: UserRole
  bonusBalance: number
  maxUserId: number | null
  maxLinkedAt: string | null
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  sessionId: string
  user: User
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  sessionId: string
}

export interface UserSession {
  id: string
  userAgent: string | null
  lastActiveAt: string
  expiresAt: string
  current: boolean
}
