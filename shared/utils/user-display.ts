import { isPlaceholderPhone } from './synthetic-phone-detect'

/** First letters of first and last word (FIO-style), or single letter for one word. */
export const formatUserInitials = (name: string | null | undefined): string => {
  const trimmed = name?.trim()

  if (!trimmed) {
    return '?'
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    const first = parts[0]?.charAt(0) ?? ''
    const last = parts[parts.length - 1]?.charAt(0) ?? ''
    return `${first}${last}`.toUpperCase()
  }

  return trimmed.charAt(0).toUpperCase()
}

export const formatUserDisplayName = (user: {
  name?: string | null
  phone?: string | null
}): string => {
  const name = user.name?.trim()

  if (name) {
    return name
  }

  if (user.phone && !isPlaceholderPhone(user.phone)) {
    return user.phone
  }

  return ''
}

export const needsProfileCompletion = (user: {
  name?: string | null
  phone?: string | null
}): boolean => !user.name?.trim() || isPlaceholderPhone(user.phone ?? '')
