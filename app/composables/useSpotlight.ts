import type { SpotlightHero, SpotlightPhoto, SpotlightVoteState } from '#shared/types/spotlight'
import { authorizationHeaders } from '#shared/utils/auth-headers'
import type { SpotlightVoteInput } from '#shared/schemas/spotlight'

export const useSpotlight = () => {
  const { fetchMe } = useAuth()

  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const fetchHero = () => $fetch<SpotlightHero>('/api/spotlight/hero')

  const fetchPhotos = (month?: string) =>
    $fetch<SpotlightPhoto[]>('/api/spotlight/photos', {
      query: month ? { month } : undefined,
    })

  const fetchVoteState = (month?: string) =>
    $fetch<SpotlightVoteState>('/api/spotlight/vote', {
      query: month ? { month } : undefined,
    })

  const vote = async (input: SpotlightVoteInput) => {
    await fetchMe()
    return $fetch<{ monthKey: string, photoId: string }>('/api/spotlight/vote', {
      method: 'POST',
      headers: authHeaders(),
      body: input,
    })
  }

  const uploadPhoto = async (formData: FormData) => {
    await fetchMe()
    return $fetch<SpotlightPhoto>('/api/spotlight/photos', {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    })
  }

  const fetchAdminPending = async () => {
    await fetchMe()
    return $fetch<SpotlightPhoto[]>('/api/admin/spotlight/photos', { headers: authHeaders() })
  }

  const updatePhotoStatus = async (id: string, status: 'approved' | 'rejected') => {
    await fetchMe()
    return $fetch<SpotlightPhoto>(`/api/admin/spotlight/photos/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: { status },
    })
  }

  const closeMonth = async (monthKey?: string) => {
    await fetchMe()
    return $fetch<{ monthKey: string, winnerPhotoId: string }>('/api/admin/spotlight/close-month', {
      method: 'POST',
      headers: authHeaders(),
      body: monthKey ? { monthKey } : {},
    })
  }

  return {
    fetchHero,
    fetchPhotos,
    fetchVoteState,
    vote,
    uploadPhoto,
    fetchAdminPending,
    updatePhotoStatus,
    closeMonth,
  }
}
