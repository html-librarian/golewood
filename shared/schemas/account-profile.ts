import type { z } from 'zod'
import { phoneSchema } from './auth'
import { userNamePartsSchema } from './user-name'

export const completeProfileSchema = userNamePartsSchema.extend({
  phone: phoneSchema,
})

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>
