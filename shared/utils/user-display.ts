import { isPlaceholderPhone } from './synthetic-phone-detect'
import { buildFullName, formatNameInitials, resolveUserNameParts } from './user-name'

export type UserDisplaySource = {
  name?: string | null
  lastName?: string | null
  firstName?: string | null
  patronymic?: string | null
  phone?: string | null
}

/** First letters of family name and given name (Голев Максим → ГМ). */
export const formatUserInitials = (user: UserDisplaySource | string | null | undefined): string => {
  if (typeof user === 'string' || user === null || user === undefined) {
    return formatNameInitials(resolveUserNameParts({ name: user ?? null }))
  }

  return formatNameInitials(resolveUserNameParts(user))
}

export const formatUserDisplayName = (user: UserDisplaySource): string => {
  const parts = resolveUserNameParts(user)

  if (parts.lastName && parts.firstName) {
    return buildFullName({
      lastName: parts.lastName,
      firstName: parts.firstName,
      patronymic: parts.patronymic,
    })
  }

  const legacy = user.name?.trim()

  if (legacy) {
    return legacy
  }

  if (user.phone && !isPlaceholderPhone(user.phone)) {
    return user.phone
  }

  return ''
}

export const needsProfileCompletion = (user: UserDisplaySource): boolean => {
  const parts = resolveUserNameParts(user)

  return !parts.lastName || !parts.firstName || isPlaceholderPhone(user.phone ?? '')
}
