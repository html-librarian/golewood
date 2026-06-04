import { describe, expect, it } from 'vitest'

describe('FormListingSelect', () => {
  it('uses global i18n keys for search', async () => {
    const ru = await import('../../../../i18n/locales/ru.json')
    const en = await import('../../../../i18n/locales/en.json')

    expect(ru.default.form.listingSelectSearch).toBeTruthy()
    expect(en.default.form.listingSelectSearch).toBeTruthy()
    expect(ru.default.form.listingSelectEmpty).toBeTruthy()
    expect(en.default.form.listingSelectEmpty).toBeTruthy()
    expect(ru.default.form.listingSelectPlaceholder).toBeTruthy()
    expect(en.default.form.listingSelectPlaceholder).toBeTruthy()
  })
})
