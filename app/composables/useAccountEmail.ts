import type { User } from '#shared/types/user'

export const useAccountEmail = () => {
  const { authHeaders, user } = useAuth()

  const sendLinkCode = async (email: string) =>
    $fetch('/api/account/email/send-code', {
      method: 'POST',
      headers: authHeaders.value,
      body: { email },
    })

  const verifyLinkCode = async (email: string, code: string) => {
    const updated = await $fetch<User>('/api/account/email/verify', {
      method: 'POST',
      headers: authHeaders.value,
      body: { email, code },
    })

    if (user.value) {
      user.value = updated
    }

    return updated
  }

  const unlinkEmail = async () => {
    const updated = await $fetch<User>('/api/account/email', {
      method: 'DELETE',
      headers: authHeaders.value,
    })

    if (user.value) {
      user.value = updated
    }

    return updated
  }

  return { sendLinkCode, verifyLinkCode, unlinkEmail }
}
