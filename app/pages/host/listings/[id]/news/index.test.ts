import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('host listing news page', () => {
  it('exposes i18n keys', () => {
    expect(ru.title).toBe('Новости объявления')
    expect(ru.createTitle).toBeTruthy()
  })
})
