import { describe, expect, it } from 'vitest'

describe('BlogAuthorCard', () => {
  it('uses global i18n keys', async () => {
    const ru = await import('../../../../i18n/locales/ru.json')
    const en = await import('../../../../i18n/locales/en.json')

    expect(ru.default.blog.authorMeta).toBeTruthy()
    expect(en.default.blog.authorMeta).toBeTruthy()
    expect(ru.default.blog.followAuthor).toBeTruthy()
  })
})
