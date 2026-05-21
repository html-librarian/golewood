import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('host listing calendar page', () => {
  it('exposes i18n keys', () => {
    expect(ru.title).toBe('Календарь')
    expect(ru.addBlock).toBeTruthy()
    expect(ru.gridBlockHint).toBeTruthy()
    expect(ru.google.title).toBeTruthy()
  })
})
