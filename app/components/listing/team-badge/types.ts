import type { TeamBadge } from '#shared/types/team-badge'

export interface ListingTeamBadgeProps {
  badge: TeamBadge
  showDescription?: boolean
  size?: 'sm' | 'md'
  /** На превью карточки — светлая подложка для читаемости */
  overlay?: boolean
  /** Яркий акцент на странице объекта */
  bright?: boolean
}
