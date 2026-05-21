import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('legal hub i18n', () => {
  it('lists all legal documents', () => {
    expect(ru.cards.requisites.title).toBeTruthy()
    expect(ru.cards.offer.title).toBeTruthy()
    expect(ru.cards.privacy.title).toBeTruthy()
    expect(ru.cards.terms.title).toBeTruthy()
  })
})
