export interface CalendarCell {
  iso: string
  day: number
  inMonth: boolean
  isToday: boolean
  isPast: boolean
}

export const formatIsoDate = (date: Date) => date.toISOString().slice(0, 10)

/** Calendar min-date in the user's local timezone (YYYY-MM-DD). */
export const formatLocalIsoDate = (date: Date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const isPastCalendarDate = (iso: string, minDate?: string) => {
  const min = minDate ?? formatLocalIsoDate()
  return iso < min
}

export const parseIsoDate = (value: string) => {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export const startOfMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 1))

export const addMonths = (date: Date, delta: number) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1))

export const getMonthGrid = (year: number, month: number, minDate?: string) => {
  const minIso = minDate ?? formatLocalIsoDate()
  const todayIso = formatLocalIsoDate()
  const first = startOfMonth(year, month)
  const startWeekday = (first.getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  const cells: CalendarCell[] = []

  for (let index = 0; index < startWeekday; index += 1) {
    const date = new Date(Date.UTC(year, month, index - startWeekday + 1))
    const iso = formatIsoDate(date)

    cells.push({
      iso,
      day: date.getUTCDate(),
      inMonth: false,
      isToday: iso === todayIso,
      isPast: isPastCalendarDate(iso, minIso),
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Date.UTC(year, month, day))
    const iso = formatIsoDate(date)

    cells.push({
      iso,
      day,
      inMonth: true,
      isToday: iso === todayIso,
      isPast: isPastCalendarDate(iso, minIso),
    })
  }

  while (cells.length % 7 !== 0) {
    const last = cells.at(-1)

    if (!last) {
      break
    }

    const date = parseIsoDate(last.iso)
    date.setUTCDate(date.getUTCDate() + 1)
    const iso = formatIsoDate(date)

    cells.push({
      iso,
      day: date.getUTCDate(),
      inMonth: false,
      isToday: iso === todayIso,
      isPast: isPastCalendarDate(iso, minIso),
    })
  }

  return cells
}

export const formatDisplayDate = (iso: string, locale: string) => {
  if (!iso) {
    return ''
  }

  return parseIsoDate(iso).toLocaleDateString(locale === 'en' ? 'en-GB' : 'ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

export const isRangeComplete = (start: string, end: string) =>
  Boolean(start && end && parseIsoDate(end) > parseIsoDate(start))
