import { z } from 'zod'
import { phoneSchema } from './auth'

export const completeProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: phoneSchema,
})

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>
