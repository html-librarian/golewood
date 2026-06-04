import type { BlogAuthorSummary } from '#shared/types/blog'

export interface BlogAuthorCardProps {
  author: BlogAuthorSummary
  showFollow?: boolean
}
