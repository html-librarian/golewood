import { z } from 'zod'

export const attachListingsToPropertySchema = z.object({
  listingIds: z.array(z.string().uuid()).min(1).max(50),
})

export type AttachListingsToPropertyInput = z.infer<typeof attachListingsToPropertySchema>
