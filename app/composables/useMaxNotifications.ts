import type { MaxLinkStart, MaxLinkStatus } from '#shared/types/max'

export const useMaxNotifications = () => {
  const { authHeaders } = useAuth()

  const fetchStatus = () =>
    $fetch<MaxLinkStatus>('/api/account/max', { headers: authHeaders.value })

  const startLink = () =>
    $fetch<MaxLinkStart>('/api/account/max/link', {
      method: 'POST',
      headers: authHeaders.value,
    })

  const unlink = () =>
    $fetch('/api/account/max', {
      method: 'DELETE',
      headers: authHeaders.value,
    })

  const mockLink = () =>
    $fetch<{ maxUserId: number }>('/api/account/max/mock-link', {
      method: 'POST',
      headers: authHeaders.value,
    })

  return {
    fetchStatus,
    startLink,
    unlink,
    mockLink,
  }
}
