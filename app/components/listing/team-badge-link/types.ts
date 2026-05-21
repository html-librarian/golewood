import type { TeamBadge } from '#shared/types/team-badge'

export interface ListingTeamBadgeLinkProps {
  badge: TeamBadge
  to?: string
  size?: 'sm' | 'md'
}
