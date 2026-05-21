const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export interface BookingRouteQuery {
  checkIn: string | null
  checkOut: string | null
  guests: number | null
}

export const parseBookingRouteQuery = (query: Record<string, unknown>): BookingRouteQuery => {
  const checkIn = typeof query.checkIn === 'string' && DATE_RE.test(query.checkIn)
    ? query.checkIn
    : null

  const checkOutRaw = typeof query.checkOut === 'string' && DATE_RE.test(query.checkOut)
    ? query.checkOut
    : null

  const checkOut = checkIn && checkOutRaw && checkOutRaw > checkIn ? checkOutRaw : null

  let guests: number | null = null
  const guestsRaw = query.guests

  if (typeof guestsRaw === 'string' && /^\d+$/.test(guestsRaw)) {
    const parsed = Number(guestsRaw)

    if (parsed >= 1 && parsed <= 50) {
      guests = parsed
    }
  }

  return { checkIn, checkOut, guests }
}
