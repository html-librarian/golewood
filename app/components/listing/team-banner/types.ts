import type { TeamBadge } from '#shared/types/team-badge'

export interface ListingTeamBannerProps {
  notice: string
  badge?: TeamBadge | null
  badgeHref?: string
}
