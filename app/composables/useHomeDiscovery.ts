import type { HomeDiscoveryGroup } from '#shared/catalog/home-discovery'
import { HOME_DISCOVERY_GROUPS } from '#shared/catalog/home-discovery'
import type { HomeDiscoveryAdminGroup, HomeDiscoveryAdminItem } from '#shared/types/home-discovery-admin'
import type { CreateHomeDiscoveryItemInput, UpdateHomeDiscoveryItemInput } from '#shared/schemas/home-discovery'
import { authorizationHeaders } from '#shared/utils/auth-headers'

export const useHomeDiscovery = () => {
  const { fetchMe } = useAuth()

  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const fetchDiscoveryGroups = async () => {
    try {
      return await $fetch<HomeDiscoveryGroup[]>('/api/home-discovery')
    } catch {
      return HOME_DISCOVERY_GROUPS
    }
  }

  const fetchAdminDiscovery = async () => {
    await fetchMe()
    return $fetch<HomeDiscoveryAdminGroup[]>('/api/admin/home-discovery', {
      headers: authHeaders(),
    })
  }

  const updateDiscoveryItem = async (id: string, input: UpdateHomeDiscoveryItemInput) =>
    $fetch<HomeDiscoveryAdminItem>(`/api/admin/home-discovery/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: input,
    })

  const createDiscoveryItem = async (input: CreateHomeDiscoveryItemInput) => {
    await fetchMe()
    return $fetch<HomeDiscoveryAdminItem>('/api/admin/home-discovery/items', {
      method: 'POST',
      headers: authHeaders(),
      body: input,
    })
  }

  const deleteDiscoveryItem = async (id: string) => {
    await fetchMe()
    return $fetch(`/api/admin/home-discovery/items/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  }

  const moveDiscoveryItem = async (id: string, direction: 'up' | 'down') => {
    await fetchMe()
    return $fetch<HomeDiscoveryAdminGroup[]>(`/api/admin/home-discovery/items/${id}/move`, {
      method: 'POST',
      headers: authHeaders(),
      body: { direction },
    })
  }

  const uploadDiscoveryImage = async (id: string, file: File) => {
    await fetchMe()
    const formData = new FormData()
    formData.append('file', file)

    return $fetch<HomeDiscoveryAdminItem>(`/api/admin/home-discovery/items/${id}/image`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    })
  }

  const clearDiscoveryImage = async (id: string) =>
    $fetch<HomeDiscoveryAdminItem>(`/api/admin/home-discovery/items/${id}/image`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

  const modeOptions = [
    { value: 'auto' as const, labelKey: 'modeAuto' as const },
    { value: 'contest' as const, labelKey: 'modeContest' as const },
    { value: 'custom' as const, labelKey: 'modeCustom' as const },
  ]

  return {
    fetchDiscoveryGroups,
    fetchAdminDiscovery,
    updateDiscoveryItem,
    createDiscoveryItem,
    deleteDiscoveryItem,
    moveDiscoveryItem,
    uploadDiscoveryImage,
    clearDiscoveryImage,
    modeOptions,
  }
}
