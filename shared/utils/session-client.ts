import type { SessionClientMeta } from '#shared/types/session'

export type SessionDeviceLabels = {
  unknown: string
  phone: string
}

/** Короткая подпись устройства из User-Agent (без внешних библиотек). */
export const formatSessionDeviceLabel = (
  userAgent: string | null | undefined,
  labels: SessionDeviceLabels,
): string => {
  const ua = userAgent?.trim()

  if (!ua) {
    return labels.unknown
  }

  const lower = ua.toLowerCase()
  const mobile = /iphone|ipad|android|mobile/.test(lower)

  let browser = labels.unknown

  if (lower.includes('edg/')) {
    browser = 'Edge'
  } else if (lower.includes('firefox/')) {
    browser = 'Firefox'
  } else if (lower.includes('chrome/') && !lower.includes('edg/')) {
    browser = 'Chrome'
  } else if (lower.includes('safari/') && !lower.includes('chrome/')) {
    browser = 'Safari'
  } else if (lower.includes('opr/') || lower.includes('opera')) {
    browser = 'Opera'
  }

  let os = ''

  if (lower.includes('iphone') || lower.includes('ipad')) {
    os = 'iOS'
  } else if (lower.includes('android')) {
    os = 'Android'
  } else if (lower.includes('windows')) {
    os = 'Windows'
  } else if (lower.includes('mac os')) {
    os = 'macOS'
  } else if (lower.includes('linux')) {
    os = 'Linux'
  }

  const parts = [browser]

  if (os) {
    parts.push(os)
  }

  if (mobile) {
    parts.push(labels.phone)
  }

  return parts.join(' · ')
}

export const sessionMetaFromUserAgent = (userAgent: string | null | undefined): SessionClientMeta => ({
  userAgent: userAgent?.trim().slice(0, 512) ?? null,
})
