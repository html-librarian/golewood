import { describe, expect, it } from 'vitest'
import {
  buildFullName,
  formatNameInitials,
  parseLegacyFullName,
  resolveUserNameParts,
} from './user-name'

describe('user-name', () => {
  it('builds full name in Russian order', () => {
    expect(buildFullName({
      lastName: 'Голев',
      firstName: 'Максим',
      patronymic: 'Иванович',
    })).toBe('Голев Максим Иванович')
  })

  it('parses legacy three-part name', () => {
    expect(parseLegacyFullName('Голев Максим Иванович')).toEqual({
      lastName: 'Голев',
      firstName: 'Максим',
      patronymic: 'Иванович',
    })
  })

  it('formats initials from last and first name', () => {
    expect(formatNameInitials(resolveUserNameParts({
      lastName: 'Голев',
      firstName: 'Максим',
      patronymic: 'Иванович',
      name: null,
    }))).toBe('ГМ')
  })

  it('does not use patronymic for initials', () => {
    expect(formatNameInitials(parseLegacyFullName('Голев Максим Иванович'))).toBe('ГМ')
  })
})
