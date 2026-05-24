import { z } from 'zod'

const namePart = z.string().trim().min(1, 'Required').max(64)

export const userNamePartsSchema = z.object({
  lastName: namePart,
  firstName: namePart,
  patronymic: z.string().trim().max(64).optional(),
})

export type UserNamePartsSchemaInput = z.infer<typeof userNamePartsSchema>
