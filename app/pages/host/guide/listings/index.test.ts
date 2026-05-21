import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'
import en from './i18n/en'

describe('host guide listings', () => {
  it('has guide sections', () => {
    expect(ru.sections.length).toBeGreaterThan(0)
    expect(ru.sections.length).toBe(en.sections.length)
  })
})
