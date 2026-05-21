import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('account page', () => {
  it('exposes i18n keys', () => {
    expect(ru.title).toBe('Личный кабинет')
    expect(ru.sessions.title).toBeTruthy()
    expect(ru.phoneLink.verifyCurrentCode).toBeTruthy()
    expect(ru.twoFactor.title).toBeTruthy()
  })
})
