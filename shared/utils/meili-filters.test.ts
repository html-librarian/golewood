import { describe, expect, it } from 'vitest'
import { buildMeiliFilters } from './meili-filters'

describe('buildMeiliFilters', () => {
  it('adds team catalog filter when enabled', () => {
    const filters = buildMeiliFilters({ teamCatalog: true })

    expect(filters).toContain('managedByTeam = true')
  })
})
