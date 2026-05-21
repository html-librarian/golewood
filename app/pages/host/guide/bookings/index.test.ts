import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('host guide bookings', () => {
  it('has sections', () => {
    expect(ru.sections.length).toBeGreaterThan(2)
  })
})
