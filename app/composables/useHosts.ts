import type { UpdateHostProfileDescriptionInput } from '#shared/schemas/host-profile'
import type { HostPublicProfile } from '#shared/types/host'

export const useHosts = () => {
  const { fetchMe, authHeaders } = useAuth()

  const fetchHostProfile = (id: string) =>
    $fetch<HostPublicProfile>(`/api/hosts/${id}`)

  const updateHostProfileDescription = async (input: UpdateHostProfileDescriptionInput) => {
    await fetchMe()

    return $fetch<{ profileDescription: string | null }>('/api/host/profile-description', {
      method: 'PATCH',
      headers: authHeaders.value,
      body: input,
    })
  }

  return {
    fetchHostProfile,
    updateHostProfileDescription,
  }
}
