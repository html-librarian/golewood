import { z } from 'zod'

export const createReviewReplySchema = z.object({
  text: z.string().trim().min(1).max(2000),
  parentReplyId: z.string().uuid().optional(),
})

export type CreateReviewReplyInput = z.infer<typeof createReviewReplySchema>
