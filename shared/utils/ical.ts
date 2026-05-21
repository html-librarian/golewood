import { formatDate, parseDate } from './dates'

export interface IcalEvent {
  uid: string
  startDate: string
  endDate: string
}

const unfoldIcal = (raw: string) =>
  raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, '')

const parseIcalDateValue = (value: string) => {
  const trimmed = value.trim()

  if (/^\d{8}$/.test(trimmed)) {
    const year = trimmed.slice(0, 4)
    const month = trimmed.slice(4, 6)
    const day = trimmed.slice(6, 8)
    return `${year}-${month}-${day}`
  }

  if (/^\d{8}T/.test(trimmed)) {
    const year = trimmed.slice(0, 4)
    const month = trimmed.slice(4, 6)
    const day = trimmed.slice(6, 8)
    return `${year}-${month}-${day}`
  }

  return null
}

const parseIcalDateLine = (line: string) => {
  const colon = line.indexOf(':')
  if (colon === -1) {
    return null
  }

  const namePart = line.slice(0, colon)
  const value = line.slice(colon + 1)

  if (!namePart.startsWith('DTSTART')) {
    return null
  }

  return parseIcalDateValue(value)
}

const parseIcalEndLine = (line: string) => {
  const colon = line.indexOf(':')
  if (colon === -1) {
    return null
  }

  const namePart = line.slice(0, colon)
  const value = line.slice(colon + 1)

  if (!namePart.startsWith('DTEND')) {
    return null
  }

  return parseIcalDateValue(value)
}

const isAllDayLine = (line: string) => line.includes('VALUE=DATE') || /^DTSTART;VALUE=DATE/.test(line)

export const parseIcalEvents = (raw: string): IcalEvent[] => {
  const text = unfoldIcal(raw)
  const chunks = text.split('BEGIN:VEVENT').slice(1)
  const events: IcalEvent[] = []

  for (const chunk of chunks) {
    const body = chunk.split('END:VEVENT')[0] ?? ''
    const lines = body.split('\n').map(line => line.trim()).filter(Boolean)

    let uid = ''
    let startDate: string | null = null
    let endDate: string | null = null
    let startIsAllDay = false

    for (const line of lines) {
      if (line.startsWith('UID:')) {
        uid = line.slice(4).trim()
      }

      if (line.startsWith('DTSTART')) {
        startDate = parseIcalDateLine(line)
        startIsAllDay = isAllDayLine(line)
      }

      if (line.startsWith('DTEND')) {
        endDate = parseIcalEndLine(line)
      }
    }

    if (!uid || !startDate) {
      continue
    }

    if (!endDate) {
      const next = parseDate(startDate)
      next.setUTCDate(next.getUTCDate() + 1)
      endDate = formatDate(next)
    } else if (startIsAllDay) {
      const exclusiveEnd = parseDate(endDate)
      endDate = formatDate(exclusiveEnd)
    } else {
      const inclusiveEnd = parseDate(endDate)
      inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() + 1)
      endDate = formatDate(inclusiveEnd)
    }

    if (endDate <= startDate) {
      continue
    }

    events.push({ uid, startDate, endDate })
  }

  return events
}

export const buildIcalCalendar = (events: Array<{
  uid: string
  startDate: string
  endDate: string
  summary: string
}>) => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Golewood//Calendar//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const event of events) {
    const start = event.startDate.replace(/-/g, '')
    const end = event.endDate.replace(/-/g, '')
    const summary = event.summary.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,')

    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${summary}`,
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  return `${lines.join('\r\n')}\r\n`
}
