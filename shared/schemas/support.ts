import { z } from 'zod'

export const supportContactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(10).max(5000),
  contextUrl: z.preprocess(
    (value) => (typeof value === 'string' && !value.trim() ? undefined : value),
    z.string().url().max(512).optional(),
  ),
})

export type SupportContactInput = z.infer<typeof supportContactSchema>
