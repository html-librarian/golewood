import type { HostDashboardStats } from '#shared/types/host'
import { authorizationHeaders } from '#shared/utils/auth-headers'

export const useHost = () => {
  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const fetchStats = () =>
    $fetch<HostDashboardStats>('/api/host/stats', { headers: authHeaders() })

  return {
    fetchStats,
  }
}
