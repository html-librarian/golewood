import type { HomePromoBanner, HomePromoImageBreakpoint, HomePromoSection } from '#shared/types/home-promo'
import type { CreateHomePromoBannerInput, UpdateHomePromoBannerInput } from '#shared/schemas/home-promo'
import { authorizationHeaders } from '#shared/utils/auth-headers'

export const useHomePromos = () => {
  const { fetchMe } = useAuth()

  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const fetchHomePromos = () => $fetch<HomePromoSection>('/api/home-promos')

  const fetchAdminPromos = async () => {
    await fetchMe()
    return $fetch<HomePromoBanner[]>('/api/admin/home-promos', { headers: authHeaders() })
  }

  const createPromo = async (input: CreateHomePromoBannerInput) => {
    await fetchMe()
    return $fetch<HomePromoBanner>('/api/admin/home-promos', {
      method: 'POST',
      headers: authHeaders(),
      body: input,
    })
  }

  const updatePromo = async (id: string, input: UpdateHomePromoBannerInput) =>
    $fetch<HomePromoBanner>(`/api/admin/home-promos/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: input,
    })

  const deletePromo = async (id: string) => {
    await fetchMe()
    return $fetch(`/api/admin/home-promos/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  }

  const movePromo = async (id: string, direction: 'up' | 'down') => {
    await fetchMe()
    return $fetch<HomePromoBanner[]>(`/api/admin/home-promos/${id}/move`, {
      method: 'POST',
      headers: authHeaders(),
      body: { direction },
    })
  }

  const uploadPromoImage = async (id: string, breakpoint: HomePromoImageBreakpoint, file: File) => {
    await fetchMe()
    const formData = new FormData()
    formData.append('file', file)

    return $fetch<HomePromoBanner>(`/api/admin/home-promos/${id}/images/${breakpoint}`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    })
  }

  const clearPromoImage = async (id: string, breakpoint: HomePromoImageBreakpoint) =>
    $fetch<HomePromoBanner>(`/api/admin/home-promos/${id}/images/${breakpoint}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

  return {
    fetchHomePromos,
    fetchAdminPromos,
    createPromo,
    updatePromo,
    deletePromo,
    movePromo,
    uploadPromoImage,
    clearPromoImage,
  }
}
