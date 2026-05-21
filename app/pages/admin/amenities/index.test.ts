import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('admin amenities page', () => {
  it('exposes i18n keys', () => {
    expect(ru.title).toBe('Удобства')
    expect(ru.add).toBeTruthy()
  })
})
