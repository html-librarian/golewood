import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('admin cities page', () => {
  it('exposes i18n keys', () => {
    expect(ru.title).toBe('Города')
    expect(ru.add).toBeTruthy()
  })
})
