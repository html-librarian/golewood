import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('help faq i18n', () => {
  it('has faq entries', () => {
    expect(ru.items.length).toBeGreaterThan(3)
  })
})
