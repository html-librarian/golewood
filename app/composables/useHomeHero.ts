import type { HomeHero, HomeHeroAdminSettings } from '#shared/types/home-hero'
import type { UpdateHomeHeroSettingsInput } from '#shared/schemas/home-hero'
import { authorizationHeaders } from '#shared/utils/auth-headers'

export const useHomeHero = () => {
  const { fetchMe } = useAuth()

  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const fetchHomeHero = () => $fetch<HomeHero>('/api/home-hero')

  const fetchAdminSettings = async () => {
    await fetchMe()
    return $fetch<HomeHeroAdminSettings>('/api/admin/home-hero', { headers: authHeaders() })
  }

  const updateSettings = async (input: UpdateHomeHeroSettingsInput) => {
    await fetchMe()
    return $fetch<HomeHeroAdminSettings>('/api/admin/home-hero', {
      method: 'PATCH',
      headers: authHeaders(),
      body: input,
    })
  }

  const uploadBanner = async (file: File) => {
    await fetchMe()
    const formData = new FormData()
    formData.append('file', file)

    return $fetch<HomeHeroAdminSettings>('/api/admin/home-hero/banner', {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    })
  }

  const clearBanner = async () => {
    await fetchMe()
    return $fetch<HomeHeroAdminSettings>('/api/admin/home-hero/banner', {
      method: 'DELETE',
      headers: authHeaders(),
    })
  }

  const modeOptions = [
    { value: 'auto' as const, labelKey: 'modeAuto' as const },
    { value: 'contest' as const, labelKey: 'modeContest' as const },
    { value: 'custom' as const, labelKey: 'modeCustom' as const },
  ]

  return {
    fetchHomeHero,
    fetchAdminSettings,
    updateSettings,
    uploadBanner,
    clearBanner,
    modeOptions,
  }
}
