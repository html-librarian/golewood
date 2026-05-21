import type { UserSession } from '#shared/types/user'

export const useAccountSessions = () => {
  const { authHeaders, refreshToken } = useAuth()

  const fetchSessions = () =>
    $fetch<{ sessions: UserSession[] }>('/api/account/sessions', {
      headers: authHeaders.value,
      query: refreshToken.value ? { refreshToken: refreshToken.value } : undefined,
    })

  const revokeSession = (sessionId: string) =>
    $fetch(`/api/account/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: authHeaders.value,
    })

  const revokeOtherSessions = () =>
    $fetch('/api/account/sessions/revoke-others', {
      method: 'POST',
      headers: authHeaders.value,
      body: { refreshToken: refreshToken.value },
    })

  return { fetchSessions, revokeSession, revokeOtherSessions }
}
