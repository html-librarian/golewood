import { z } from 'zod'

export const createStorySchema = z.object({
  listingId: z.string().uuid(),
})
