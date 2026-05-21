import { describe, expect, it } from 'vitest'
import { buildPlatformLegalDetails } from './platform-legal'

describe('buildPlatformLegalDetails', () => {
  it('returns demo requisites for ru locale', () => {
    const details = buildPlatformLegalDetails('ru')

    expect(details.legalName).toContain('Голевуд')
    expect(details.inn).toMatch(/^\d+$/)
    expect(details.email).toContain('@')
  })

  it('prefers env overrides', () => {
    const details = buildPlatformLegalDetails('ru', {
      operatorLegalName: 'ООО Тест',
      supportEmail: 'billing@test.ru',
    })

    expect(details.legalName).toBe('ООО Тест')
    expect(details.email).toBe('billing@test.ru')
  })
})
