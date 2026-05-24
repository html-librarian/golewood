const LISTING_PATH_RE = /\/listings\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const parseListingIdFromInput = (input: string): string | null => {
  const trimmed = input.trim()

  if (!trimmed) {
    return null
  }

  if (UUID_RE.test(trimmed)) {
    return trimmed
  }

  try {
    const url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(trimmed, 'https://golewood.ru')
    const match = url.pathname.match(LISTING_PATH_RE)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

export const normalizeExternalUrl = (input: string): string | null => {
  const trimmed = input.trim()

  if (!trimmed) {
    return null
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

export const normalizeInstagramInput = (input: string): string | null => {
  const trimmed = input.trim()

  if (!trimmed) {
    return null
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('instagram.com')) {
    return normalizeExternalUrl(trimmed.replace(/^@/, ''))
  }

  const handle = trimmed.replace(/^@/, '').replace(/\s+/g, '')

  if (!handle) {
    return null
  }

  return `https://instagram.com/${handle}`
}
