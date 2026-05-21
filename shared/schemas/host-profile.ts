import { z } from 'zod'

export const updateHostProfileDescriptionSchema = z.object({
  description: z.string().trim().max(2000),
})

export type UpdateHostProfileDescriptionInput = z.infer<typeof updateHostProfileDescriptionSchema>
