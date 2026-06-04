import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('blog edit page', () => {
  it('exposes i18n keys', () => {
    expect(ru.title).toBeTruthy()
    expect(ru.saved).toBeTruthy()
  })
})
