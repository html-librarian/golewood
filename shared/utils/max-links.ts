const START_SAFE = /^[a-zA-Z0-9_-]+$/

export const sanitizeMaxStartParam = (value: string) => {
  const trimmed = value.trim().slice(0, 128)
  return START_SAFE.test(trimmed) ? trimmed : ''
}

export const buildMaxBotDeepLink = (botUsername: string, start: string) => {
  const safe = sanitizeMaxStartParam(start)

  if (!safe) {
    return `https://max.ru/${botUsername}`
  }

  const url = new URL(`https://max.ru/${botUsername}`)
  url.searchParams.set('start', safe)
  return url.toString()
}

export const buildMaxLinkStartParam = (linkCode: string) => {
  const normalized = linkCode.replace(/^GW[-_]?/i, '').replace(/[^A-Z0-9]/gi, '')
  return sanitizeMaxStartParam(`link_${normalized}`)
}

export const buildMaxMiniAppUrl = (siteUrl: string, startapp?: string) => {
  const base = siteUrl.replace(/\/$/, '')
  const url = new URL(`${base}/max`)

  if (startapp) {
    const safe = sanitizeMaxStartParam(startapp)

    if (safe) {
      url.searchParams.set('startapp', safe)
    }
  }

  return url.toString()
}

export const buildMaxBookingStartapp = (bookingId: string) => `booking_${bookingId}`

export type MaxBotStartIntent =
  | { kind: 'link', code: string }
  | { kind: 'bookings' }
  | { kind: 'booking', bookingId: string }
  | { kind: 'unknown' }

export const parseMaxBotStart = (raw: string): MaxBotStartIntent => {
  const trimmed = raw.trim()

  if (!trimmed) {
    return { kind: 'unknown' }
  }

  if (trimmed === 'bookings') {
    return { kind: 'bookings' }
  }

  const bookingMatch = trimmed.match(/^booking_([0-9a-f-]{36})$/i)

  if (bookingMatch?.[1]) {
    return { kind: 'booking', bookingId: bookingMatch[1] }
  }

  if (trimmed.startsWith('link_')) {
    return { kind: 'link', code: trimmed.slice(5) }
  }

  return { kind: 'link', code: trimmed }
}
