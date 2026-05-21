import { z } from 'zod'

export const createCalendarFeedSchema = z.object({
  label: z.string().trim().min(1).max(128),
  feedUrl: z.string().trim().url().max(2048),
})

export type CreateCalendarFeedInput = z.infer<typeof createCalendarFeedSchema>

export const createGoogleCalendarFeedSchema = z.object({
  label: z.string().trim().min(1).max(128),
  googleCalendarId: z.string().trim().min(1).max(255),
})

export type CreateGoogleCalendarFeedInput = z.infer<typeof createGoogleCalendarFeedSchema>
