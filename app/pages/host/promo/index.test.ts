import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('host promo balance page', () => {
  it('exposes i18n keys', () => {
    expect(ru.title).toBe('Баланс продвижения')
    expect(ru.productsTitle).toBeTruthy()
    expect(ru.buyTitle).toBeTruthy()
  })
})
