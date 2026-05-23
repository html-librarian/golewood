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

  it('coerces numeric env values (INN without quotes in .env)', () => {
    const details = buildPlatformLegalDetails('ru', {
      operatorInn: 7710140679,
      operatorKpp: 771301001,
      operatorOgrn: 1027739642281,
    })

    expect(details.inn).toBe('7710140679')
    expect(details.kpp).toBe('771301001')
    expect(details.ogrn).toBe('1027739642281')
  })
})
