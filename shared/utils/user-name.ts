export type UserNameParts = {
  lastName: string | null
  firstName: string | null
  patronymic: string | null
}

export type UserNamePartsInput = {
  lastName: string
  firstName: string
  patronymic?: string | null
}

/** Full name in Russian order: Фамилия Имя Отчество */
export const buildFullName = (parts: UserNamePartsInput): string =>
  [parts.lastName.trim(), parts.firstName.trim(), parts.patronymic?.trim()]
    .filter((part): part is string => Boolean(part))
    .join(' ')

/** Parse legacy single `name` field (assumes Фамилия Имя [Отчество…]). */
export const parseLegacyFullName = (name: string | null | undefined): UserNameParts => {
  const trimmed = name?.trim()

  if (!trimmed) {
    return { lastName: null, firstName: null, patronymic: null }
  }

  const words = trimmed.split(/\s+/).filter(Boolean)

  if (words.length >= 3) {
    return {
      lastName: words[0] ?? null,
      firstName: words[1] ?? null,
      patronymic: words.slice(2).join(' ') || null,
    }
  }

  if (words.length === 2) {
    return {
      lastName: words[0] ?? null,
      firstName: words[1] ?? null,
      patronymic: null,
    }
  }

  return {
    lastName: null,
    firstName: words[0] ?? null,
    patronymic: null,
  }
}

export const resolveUserNameParts = (user: {
  lastName?: string | null
  firstName?: string | null
  patronymic?: string | null
  name?: string | null
}): UserNameParts => {
  const lastName = user.lastName?.trim() || null
  const firstName = user.firstName?.trim() || null
  const patronymic = user.patronymic?.trim() || null

  if (lastName || firstName) {
    return { lastName, firstName, patronymic }
  }

  return parseLegacyFullName(user.name)
}

/** Initials: first letter of last name + first letter of first name (Голев Максим → ГМ). */
export const formatNameInitials = (parts: UserNameParts): string => {
  const last = parts.lastName?.charAt(0) ?? ''
  const first = parts.firstName?.charAt(0) ?? ''

  if (last && first) {
    return `${last}${first}`.toUpperCase()
  }

  if (first) {
    return first.toUpperCase()
  }

  if (last) {
    return last.toUpperCase()
  }

  const legacy = parts.patronymic?.trim()

  if (legacy) {
    return legacy.charAt(0).toUpperCase()
  }

  return '?'
}

export const userNamePartsFromWestern = (firstName: string, lastName: string, patronymic?: string | null): UserNamePartsInput => ({
  lastName: lastName.trim(),
  firstName: firstName.trim(),
  patronymic: patronymic?.trim() || undefined,
})

export const userNamePartsFromLegacyString = (name: string): UserNamePartsInput | null => {
  const parsed = parseLegacyFullName(name)

  if (!parsed.lastName || !parsed.firstName) {
    return null
  }

  return {
    lastName: parsed.lastName,
    firstName: parsed.firstName,
    patronymic: parsed.patronymic,
  }
}
