import { z } from 'zod'

export const startConversationSchema = z.object({
  listingId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000).optional(),
})

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
})

export type StartConversationInput = z.infer<typeof startConversationSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
