export const parseDate = (value: string) => {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export const formatDate = (date: Date) => date.toISOString().slice(0, 10)

export const eachDay = (from: string, to: string) => {
  const days: string[] = []
  const current = parseDate(from)
  const end = parseDate(to)

  while (current <= end) {
    days.push(formatDate(current))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return days
}

export const countNights = (checkIn: string, checkOut: string) => {
  const start = parseDate(checkIn).getTime()
  const end = parseDate(checkOut).getTime()

  return Math.round((end - start) / (1000 * 60 * 60 * 24))
}

export const rangesOverlap = (
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) => parseDate(aStart) < parseDate(bEnd) && parseDate(bStart) < parseDate(aEnd)

export const canCompleteBooking = (checkOut: string) =>
  parseDate(checkOut) <= parseDate(formatDate(new Date()))
