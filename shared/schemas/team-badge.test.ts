import { describe, expect, it } from 'vitest'
import { assignListingTeamBadgeSchema } from './team-badge'

describe('assignListingTeamBadgeSchema', () => {
  it('accepts badge and blog post ids', () => {
    const result = assignListingTeamBadgeSchema.safeParse({
      teamBadgeId: '00000000-0000-4000-8000-000000000001',
      blogPostId: '00000000-0000-4000-8000-000000000002',
    })
    expect(result.success).toBe(true)
  })

  it('accepts clearing badge', () => {
    const result = assignListingTeamBadgeSchema.safeParse({
      teamBadgeId: null,
    })
    expect(result.success).toBe(true)
  })
})
