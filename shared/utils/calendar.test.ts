import { describe, expect, it } from 'vitest'
import { formatIsoDate, formatLocalIsoDate, getMonthGrid, isPastCalendarDate, isRangeComplete } from './calendar'

describe('calendar utils', () => {
  it('builds month grid with padding days', () => {
    const cells = getMonthGrid(2026, 4)
    expect(cells.length % 7).toBe(0)
    expect(cells.filter(cell => cell.inMonth).length).toBe(31)
  })

  it('validates range order', () => {
    expect(isRangeComplete('2026-05-10', '2026-05-12')).toBe(true)
    expect(isRangeComplete('2026-05-12', '2026-05-10')).toBe(false)
  })

  it('formats iso date', () => {
    expect(formatIsoDate(new Date(Date.UTC(2026, 4, 20)))).toBe('2026-05-20')
  })

  it('marks days before minDate as past', () => {
    const cells = getMonthGrid(2026, 4, '2026-05-20')
    const may19 = cells.find(cell => cell.inMonth && cell.iso === '2026-05-19')
    const may20 = cells.find(cell => cell.inMonth && cell.iso === '2026-05-20')

    expect(may19?.isPast).toBe(true)
    expect(may20?.isPast).toBe(false)
  })

  it('compares past dates against local today', () => {
    const today = formatLocalIsoDate()
    expect(isPastCalendarDate('2000-01-01', today)).toBe(true)
    expect(isPastCalendarDate(today, today)).toBe(false)
  })
})
