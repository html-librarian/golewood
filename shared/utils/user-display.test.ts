import { describe, expect, it } from 'vitest'
import { formatUserDisplayName, formatUserInitials, needsProfileCompletion } from './user-display'

describe('formatUserInitials', () => {
  it('uses first and last word for FIO', () => {
    expect(formatUserInitials('Иван Петров')).toBe('ИП')
    expect(formatUserInitials('Anna Maria Smith')).toBe('AS')
  })

  it('uses single letter for one word', () => {
    expect(formatUserInitials('Иван')).toBe('И')
  })

  it('returns ? when empty', () => {
    expect(formatUserInitials(null)).toBe('?')
  })
})

describe('formatUserDisplayName', () => {
  it('prefers name over phone', () => {
    expect(formatUserDisplayName({ name: 'Иван', phone: '+79001112233' })).toBe('Иван')
  })

  it('hides placeholder phone', () => {
    expect(formatUserDisplayName({ name: null, phone: '+79990394849' })).toBe('')
  })
})

describe('needsProfileCompletion', () => {
  it('requires name and real phone', () => {
    expect(needsProfileCompletion({ name: 'Иван', phone: '+79001112233' })).toBe(false)
    expect(needsProfileCompletion({ name: null, phone: '+79001112233' })).toBe(true)
    expect(needsProfileCompletion({ name: 'Иван', phone: '+79990394849' })).toBe(true)
  })
})
