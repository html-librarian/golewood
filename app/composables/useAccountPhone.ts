import type { PhoneChangeStatus } from '#shared/types/account-phone'
import type { User } from '#shared/types/user'

export const useAccountPhone = () => {
  const { authHeaders, user } = useAuth()

  const fetchChangeStatus = () =>
    $fetch<PhoneChangeStatus>('/api/account/phone/change-status', {
      headers: authHeaders.value,
    })

  const sendOldPhoneCode = () =>
    $fetch('/api/account/phone/send-old-code', {
      method: 'POST',
      headers: authHeaders.value,
    })

  const verifyOldPhoneCode = (code: string) =>
    $fetch('/api/account/phone/verify-old-code', {
      method: 'POST',
      headers: authHeaders.value,
      body: { code },
    })

  const sendChangeCode = async (phone: string) =>
    $fetch('/api/account/phone/send-code', {
      method: 'POST',
      headers: authHeaders.value,
      body: { phone },
    })

  const verifyChangeCode = async (phone: string, code: string) => {
    const updated = await $fetch<User>('/api/account/phone/verify', {
      method: 'POST',
      headers: authHeaders.value,
      body: { phone, code },
    })

    if (user.value) {
      user.value = updated
    }

    return updated
  }

  return {
    fetchChangeStatus,
    sendOldPhoneCode,
    verifyOldPhoneCode,
    sendChangeCode,
    verifyChangeCode,
  }
}
