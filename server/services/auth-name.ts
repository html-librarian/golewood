import type { UserNamePartsSchemaInput } from '#shared/schemas/user-name'
import { userNamePartsFromLegacyString } from '#shared/utils/user-name'
import { toUserNameDbColumns } from '../utils/user-name'

export type AuthNameInput = Partial<UserNamePartsSchemaInput> & {
  name?: string
}

export const resolveAuthNameColumns = (input: AuthNameInput) => {
  if (input.lastName?.trim() && input.firstName?.trim()) {
    return toUserNameDbColumns({
      lastName: input.lastName,
      firstName: input.firstName,
      patronymic: input.patronymic,
    })
  }

  const legacy = input.name?.trim()

  if (legacy) {
    const parts = userNamePartsFromLegacyString(legacy)

    if (parts) {
      return toUserNameDbColumns(parts)
    }
  }

  return null
}

export const assertAuthNameProvided = (input: AuthNameInput) => {
  if (!resolveAuthNameColumns(input)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Last name and first name are required',
    })
  }
}
