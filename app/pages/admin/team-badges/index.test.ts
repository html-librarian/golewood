import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('admin team badges page', () => {
  it('exposes i18n keys', () => {
    expect(ru.title).toBe('Метки команды')
    expect(ru.assignTitle).toBeTruthy()
  })
})
