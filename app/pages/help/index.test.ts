import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('help hub i18n', () => {
  it('has overview content', () => {
    expect(ru.title).toBeTruthy()
    expect(ru.cards.faq.title).toBeTruthy()
  })
})
