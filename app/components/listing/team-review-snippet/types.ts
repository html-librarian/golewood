import type { BlogPostCard } from '#shared/types/blog'
import type { TeamBadge } from '#shared/types/team-badge'

export interface ListingTeamReviewSnippetProps {
  badge: TeamBadge
  blogPost: BlogPostCard
  excerptRu?: string | null
  excerptEn?: string | null
}
