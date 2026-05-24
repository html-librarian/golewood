import type { AuthSession, User } from '#shared/types/user'
import { authorizationHeaders } from '#shared/utils/auth-headers'
import type { LoginResult } from '#shared/types/two-factor'
import { isMfaChallenge } from '#shared/types/two-factor'

const ACCESS_TOKEN_KEY = 'auth-access-token'
const REFRESH_TOKEN_KEY = 'auth-refresh-token'
const SESSION_ID_KEY = 'auth-session-id'
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7

const getErrorStatus = (error: unknown) => {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = (error as { statusCode: unknown }).statusCode
    return typeof statusCode === 'number' ? statusCode : undefined
  }

  return undefined
}

export const useAuth = () => {
  const localePath = useLocalePath()
  const user = useState<User | null>('auth-user', () => null)
  const accessToken = useCookie<string | null>(ACCESS_TOKEN_KEY, {
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  })
  const refreshToken = useCookie<string | null>(REFRESH_TOKEN_KEY, {
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  })
  const sessionId = useCookie<string | null>(SESSION_ID_KEY, {
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  })
  const pending = useState('auth-pending', () => false)
  const fetchMeInFlight = useState<Promise<User | null> | null>('auth-fetch-me-inflight', () => null)

  const isAuthenticated = computed(() => !!user.value)

  const authHeaders = computed(() => authorizationHeaders(accessToken.value))

  const applySession = (session: AuthSession) => {
    user.value = session.user
    accessToken.value = session.accessToken
    refreshToken.value = session.refreshToken
    sessionId.value = session.sessionId
  }

  const clearSession = () => {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    sessionId.value = null
  }

  const refreshAccessToken = async () => {
    if (!refreshToken.value) {
      return false
    }

    try {
      const tokens = await $fetch<{ accessToken: string, refreshToken: string, sessionId: string }>('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: refreshToken.value },
      })

      accessToken.value = tokens.accessToken
      refreshToken.value = tokens.refreshToken
      sessionId.value = tokens.sessionId
      return true
    } catch {
      return false
    }
  }

  const fetchMe = async () => {
    if (!accessToken.value) {
      return null
    }

    if (fetchMeInFlight.value) {
      return fetchMeInFlight.value
    }

    const run = async (): Promise<User | null> => {
      pending.value = true

      try {
        const me = await $fetch<User>('/api/auth/me', {
          headers: authHeaders.value,
        })

        user.value = me
        return me
      } catch (error) {
        const status = getErrorStatus(error)

        if (status && status !== 401) {
          return user.value
        }

        const refreshed = await refreshAccessToken()

        if (!refreshed) {
          clearSession()
          return null
        }

        try {
          const me = await $fetch<User>('/api/auth/me', {
            headers: { Authorization: `Bearer ${accessToken.value}` },
          })

          user.value = me
          return me
        } catch (retryError) {
          const retryStatus = getErrorStatus(retryError)

          if (!retryStatus || retryStatus === 401) {
            clearSession()
          }

          return null
        }
      } finally {
        pending.value = false
      }
    }

    fetchMeInFlight.value = run()

    try {
      return await fetchMeInFlight.value
    } finally {
      fetchMeInFlight.value = null
    }
  }

  const sendCode = async (phone: string) =>
    $fetch('/api/auth/send-code', {
      method: 'POST',
      body: { phone },
    })

  const verifyCode = async (payload: {
    phone: string
    code: string
    lastName?: string
    firstName?: string
    patronymic?: string
  }) => {
    const result = await $fetch<LoginResult>('/api/auth/verify', {
      method: 'POST',
      body: payload,
    })

    if (isMfaChallenge(result)) {
      return result
    }

    applySession(result)
    return result
  }

  const sendEmailCode = async (email: string) =>
    $fetch('/api/auth/send-email-code', {
      method: 'POST',
      body: { email },
    })

  const verifyEmailCode = async (payload: {
    email: string
    code: string
    lastName?: string
    firstName?: string
    patronymic?: string
    phone?: string
    linkPhone?: string
  }) => {
    const session = await $fetch<AuthSession>('/api/auth/verify-email', {
      method: 'POST',
      body: payload,
    })

    applySession(session)
    return session
  }

  const completeProfile = async (payload: {
    lastName: string
    firstName: string
    patronymic?: string
    phone: string
  }) => {
    const updated = await $fetch<User>('/api/account/complete-profile', {
      method: 'POST',
      headers: authHeaders.value,
      body: payload,
    })

    user.value = updated
    return updated
  }

  const logout = async () => {
    if (refreshToken.value) {
      await $fetch('/api/auth/logout', {
        method: 'POST',
        body: { refreshToken: refreshToken.value },
      }).catch(() => undefined)
    }

    clearSession()
    await navigateTo(localePath('/auth/login'))
  }

  return {
    user,
    accessToken,
    refreshToken,
    sessionId,
    pending,
    isAuthenticated,
    authHeaders,
    applySession,
    clearSession,
    sendCode,
    verifyCode,
    isMfaChallenge,
    sendEmailCode,
    verifyEmailCode,
    completeProfile,
    fetchMe,
    logout,
  }
}
