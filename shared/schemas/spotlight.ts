import { z } from 'zod'
import { SPOTLIGHT_PHOTO_STATUSES } from '#shared/types/spotlight'

export const spotlightVoteSchema = z.object({
  photoId: z.string().uuid(),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

export const updateSpotlightPhotoStatusSchema = z.object({
  status: z.enum(SPOTLIGHT_PHOTO_STATUSES),
})

export const closeSpotlightMonthSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

export type SpotlightVoteInput = z.infer<typeof spotlightVoteSchema>
