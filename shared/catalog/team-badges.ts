/** Метки, для которых обязателен опубликованный пост блога с обзором места */
export const TEAM_BADGE_SLUGS_REQUIRING_BLOG = ['team_visited', 'team_approved'] as const

export type TeamBadgeSlugRequiringBlog = (typeof TEAM_BADGE_SLUGS_REQUIRING_BLOG)[number]

export const badgeSlugRequiresBlogPost = (slug: string) =>
  (TEAM_BADGE_SLUGS_REQUIRING_BLOG as readonly string[]).includes(slug)
