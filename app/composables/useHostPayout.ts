import type { HostPayoutProfile } from '#shared/types/host-payout'
import type { UpsertHostPayoutProfileInput } from '#shared/schemas/host-payout'

export const useHostPayout = () => {
  const { authHeaders } = useAuth()

  const fetchPayoutProfile = () =>
    $fetch<HostPayoutProfile>('/api/host/payout', { headers: authHeaders.value })

  const submitPayoutProfile = (body: UpsertHostPayoutProfileInput) =>
    $fetch<HostPayoutProfile>('/api/host/payout', {
      method: 'PATCH',
      headers: authHeaders.value,
      body,
    })

  return {
    fetchPayoutProfile,
    submitPayoutProfile,
  }
}
