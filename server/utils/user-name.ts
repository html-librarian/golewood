import type { UserNamePartsInput } from '#shared/utils/user-name'
import { buildFullName } from '#shared/utils/user-name'

export const toUserNameDbColumns = (input: UserNamePartsInput) => ({
  lastName: input.lastName.trim(),
  firstName: input.firstName.trim(),
  patronymic: input.patronymic?.trim() || null,
  name: buildFullName(input),
})
