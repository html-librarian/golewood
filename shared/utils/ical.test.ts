import { describe, expect, it } from 'vitest'
import { buildIcalCalendar, parseIcalEvents } from './ical'

const SAMPLE = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:external-1@test
DTSTART;VALUE=DATE:20260410
DTEND;VALUE=DATE:20260413
SUMMARY:Reserved
END:VEVENT
END:VCALENDAR`

describe('ical utils', () => {
  it('parses all-day VEVENT', () => {
    const events = parseIcalEvents(SAMPLE)
    expect(events).toHaveLength(1)
    expect(events[0]).toEqual({
      uid: 'external-1@test',
      startDate: '2026-04-10',
      endDate: '2026-04-13',
    })
  })

  it('builds calendar text', () => {
    const text = buildIcalCalendar([{
      uid: 'test@golewood',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      summary: 'Blocked',
    }])

    expect(text).toContain('BEGIN:VCALENDAR')
    expect(text).toContain('UID:test@golewood')
    expect(text).toContain('DTSTART;VALUE=DATE:20260410')
  })
})
