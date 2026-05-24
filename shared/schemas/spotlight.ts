import { z } from 'zod'
import { SPOTLIGHT_PHOTO_STATUSES } from '#shared/types/spotlight'
import {
  normalizeExternalUrl,
  normalizeInstagramInput,
  parseListingIdFromInput,
} from '#shared/utils/spotlight-listing-link'

const optionalUrlSchema = z.string().trim().max(512).optional().transform(value => {
  if (!value) {
    return null
  }

  return normalizeExternalUrl(value)
})

const optionalInstagramSchema = z.string().trim().max(255).optional().transform(value => {
  if (!value) {
    return null
  }

  return normalizeInstagramInput(value)
})

export const spotlightUploadSchema = z.object({
  listingId: z.string().trim().optional(),
  listingUrl: z.string().trim().max(512).optional(),
  placeName: z.string().trim().max(255).optional(),
  externalSiteUrl: optionalUrlSchema,
  externalInstagram: optionalInstagramSchema,
  caption: z.string().trim().max(2000).optional(),
  consent: z.boolean(),
}).superRefine((data, ctx) => {
  if (!data.consent) {
    ctx.addIssue({ code: 'custom', message: 'Publication consent is required', path: ['consent'] })
  }

  const listingId = data.listingId?.trim()
    || (data.listingUrl ? parseListingIdFromInput(data.listingUrl) : null)

  if (listingId) {
    return
  }

  const hasExternal = Boolean(data.externalSiteUrl || data.externalInstagram)

  if (!hasExternal) {
    ctx.addIssue({
      code: 'custom',
      message: 'Provide a Golewood listing link or an external website / Instagram',
      path: ['listingUrl'],
    })
  }
})

export type SpotlightUploadInput = z.infer<typeof spotlightUploadSchema> & {
  resolvedListingId: string | null
}

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
