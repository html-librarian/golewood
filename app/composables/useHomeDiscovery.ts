import type { HomeDiscoveryGroup } from '#shared/catalog/home-discovery'
import { HOME_DISCOVERY_GROUPS } from '#shared/catalog/home-discovery'
import type { HomeDiscoveryAdminGroup } from '#shared/types/home-discovery-admin'
import type { UpdateHomeDiscoveryItemInput } from '#shared/schemas/home-discovery'
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
    $fetch(`/api/admin/home-discovery/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: input,
    })

  return {
    fetchDiscoveryGroups,
    fetchAdminDiscovery,
    updateDiscoveryItem,
  }
}
