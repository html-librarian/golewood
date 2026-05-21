import type { LoginResult, TwoFactorStatus } from '#shared/types/two-factor'
import { isMfaChallenge } from '#shared/types/two-factor'
import type { AuthSession } from '#shared/types/user'

export const useTwoFactor = () => {
  const { authHeaders, fetchMe, applySession } = useAuth()

  const fetchStatus = () =>
    $fetch<TwoFactorStatus>('/api/account/two-factor', {
      headers: authHeaders.value,
    })

  const sendEnableCode = () =>
    $fetch('/api/account/two-factor/send-enable-code', {
      method: 'POST',
      headers: authHeaders.value,
    })

  const confirmEnable = async (code: string) => {
    const status = await $fetch<TwoFactorStatus>('/api/account/two-factor/confirm-enable', {
      method: 'POST',
      headers: authHeaders.value,
      body: { code },
    })

    await fetchMe()
    return status
  }

  const sendDisableCode = () =>
    $fetch('/api/account/two-factor/send-disable-code', {
      method: 'POST',
      headers: authHeaders.value,
    })

  const confirmDisable = async (code: string) => {
    const status = await $fetch<TwoFactorStatus>('/api/account/two-factor/confirm-disable', {
      method: 'POST',
      headers: authHeaders.value,
      body: { code },
    })

    await fetchMe()
    return status
  }

  const verifyMfa = async (challengeToken: string, code: string) => {
    const session = await $fetch<AuthSession>('/api/auth/verify-mfa', {
      method: 'POST',
      body: { challengeToken, code },
    })

    applySession(session)
    return session
  }

  const resendMfa = (challengeToken: string) =>
    $fetch('/api/auth/resend-mfa', {
      method: 'POST',
      body: { challengeToken },
    })

  return {
    fetchStatus,
    sendEnableCode,
    confirmEnable,
    sendDisableCode,
    confirmDisable,
    verifyMfa,
    resendMfa,
    isMfaChallenge,
  }
}

export type { LoginResult }
