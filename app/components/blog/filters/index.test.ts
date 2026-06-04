import { describe, expect, it } from 'vitest'

describe('BlogFilters', () => {
  it('uses global i18n keys for filters', async () => {
    const ru = await import('../../../../i18n/locales/ru.json')
    const en = await import('../../../../i18n/locales/en.json')

    expect(ru.default.blog.filters.apply).toBeTruthy()
    expect(ru.default.blog.filters.reset).toBeTruthy()
    expect(ru.default.blog.filters.followingOnly).toBeTruthy()
    expect(en.default.blog.filters.allCities).toBeTruthy()
    expect(en.default.blog.filters.listing).toBeTruthy()
  })
})
