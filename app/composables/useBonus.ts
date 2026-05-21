import type { BonusAccountSummary } from '#shared/types/bonus'

export const useBonus = () => {
  const { authHeaders } = useAuth()

  const fetchBonusAccount = () =>
    $fetch<BonusAccountSummary>('/api/account/bonus', { headers: authHeaders.value })

  return {
    fetchBonusAccount,
  }
}
