import { describe, expect, it } from 'vitest'
import loginRu from './login/i18n/ru'

describe('auth index page', () => {
  it('redirect route relies on login i18n', () => {
    expect(loginRu.title).toBeTruthy()
  })
})
