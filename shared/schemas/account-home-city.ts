import { z } from 'zod'

export const updateHomeCitySchema = z.object({
  homeCity: z.string().trim().min(1).max(128).nullable(),
})

export type UpdateHomeCityInput = z.infer<typeof updateHomeCitySchema>
