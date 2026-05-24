import { describe, expect, it } from 'vitest'
import { formatUserDisplayName, formatUserInitials, needsProfileCompletion } from './user-display'

describe('formatUserInitials', () => {
  it('uses family and given name', () => {
    expect(formatUserInitials({
      lastName: 'Голев',
      firstName: 'Максим',
      patronymic: 'Иванович',
    })).toBe('ГМ')
  })

  it('parses legacy full name string', () => {
    expect(formatUserInitials('Голев Максим Иванович')).toBe('ГМ')
  })

  it('returns ? when empty', () => {
    expect(formatUserInitials(null)).toBe('?')
  })
})

describe('formatUserDisplayName', () => {
  it('builds FIO from parts', () => {
    expect(formatUserDisplayName({
      lastName: 'Голев',
      firstName: 'Максим',
      patronymic: 'Иванович',
      phone: '+79001112233',
    })).toBe('Голев Максим Иванович')
  })

  it('falls back to legacy name', () => {
    expect(formatUserDisplayName({ name: 'Иван Петров', phone: '+79001112233' })).toBe('Иван Петров')
  })

  it('hides placeholder phone', () => {
    expect(formatUserDisplayName({ name: null, phone: '+79990394849' })).toBe('')
  })
})

describe('needsProfileCompletion', () => {
  it('requires last name, first name and real phone', () => {
    expect(needsProfileCompletion({
      lastName: 'Голев',
      firstName: 'Максим',
      phone: '+79001112233',
    })).toBe(false)
    expect(needsProfileCompletion({ name: null, phone: '+79001112233' })).toBe(true)
    expect(needsProfileCompletion({
      lastName: 'Голев',
      firstName: 'Максим',
      phone: '+79990394849',
    })).toBe(true)
  })
})
