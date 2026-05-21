import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('host listing promote page', () => {
  it('exposes i18n keys', () => {
    expect(ru.title).toBe('Продвижение объявления')
    expect(ru.catalogTitle).toBeTruthy()
  })
})
