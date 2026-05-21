import type { BlogPostCard } from '#shared/types/blog'
import { authorizationHeaders } from '#shared/utils/auth-headers'
import type { TeamBadge } from '#shared/types/team-badge'
import type { ListingCard } from '#shared/types/listing'
import type {
  AssignListingTeamBadgeInput,
  CreateTeamBadgeInput,
  UpdateTeamBadgeInput,
} from '#shared/schemas/team-badge'

export const useTeamBadges = () => {
  const { fetchMe } = useAuth()

  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const fetchTeamBadges = () => $fetch<TeamBadge[]>('/api/team-badges')

  const fetchAdminTeamBadges = async () => {
    await fetchMe()
    return $fetch<TeamBadge[]>('/api/admin/team-badges', { headers: authHeaders() })
  }

  const createTeamBadge = async (input: CreateTeamBadgeInput) => {
    await fetchMe()
    return $fetch<TeamBadge>('/api/admin/team-badges', {
      method: 'POST',
      headers: authHeaders(),
      body: input,
    })
  }

  const updateTeamBadge = async (id: string, input: UpdateTeamBadgeInput) =>
    $fetch<TeamBadge>(`/api/admin/team-badges/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: input,
    })

  const fetchAdminPublishedListings = async () => {
    await fetchMe()
    return $fetch<ListingCard[]>('/api/admin/listings/published', { headers: authHeaders() })
  }

  const assignListingTeamBadge = async (listingId: string, input: AssignListingTeamBadgeInput) =>
    $fetch<{ listingId: string, teamBadge: TeamBadge | null, teamBadgeBlogPost: BlogPostCard | null }>(`/api/admin/listings/${listingId}/team-badge`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: input,
    })

  return {
    fetchTeamBadges,
    fetchAdminTeamBadges,
    createTeamBadge,
    updateTeamBadge,
    fetchAdminPublishedListings,
    assignListingTeamBadge,
  }
}
