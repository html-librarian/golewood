import { z } from 'zod'
import { LISTING_TIME_PATTERN } from '../constants/listing-times'
import { listingContactsSchema } from './listing-contacts'
import { CANCELLATION_POLICIES, LISTING_STATUSES } from '../types/listing'
import { getListingExtraGuestsValidationError } from '../utils/listing-extra-guests'

const listingTimeSchema = z.string().trim().regex(LISTING_TIME_PATTERN, 'Invalid time (use HH:mm)')

const listingFieldsBaseSchema = z.object({
  title: z.string().trim().min(3).max(255),
  metaTitle: z.string().trim().max(70).nullable().optional(),
  metaDescription: z.string().trim().max(320).nullable().optional(),
  description: z.string().trim().max(5000).default(''),
  pricePerNight: z.number().int().min(1),
  city: z.string().trim().min(2).max(128),
  address: z.string().trim().max(255).default(''),
  maxGuests: z.number().int().min(1).max(50).default(1),
  bedrooms: z.number().int().min(0).max(20).default(1),
  amenities: z.array(z.string().trim().min(1).max(64)).default([]),
  accommodationType: z.string().trim().min(1).max(64).nullable().optional(),
  houseRules: z.string().trim().max(2000).default(''),
  checkInTime: listingTimeSchema.default('15:00'),
  checkOutTime: listingTimeSchema.default('12:00'),
  cancellationPolicy: z.enum(CANCELLATION_POLICIES).default('moderate'),
  transferOffered: z.boolean().default(false),
  transferPrice: z.number().int().min(0).max(500_000).nullable().optional(),
  transferPriceOnRequest: z.boolean().default(false),
  extraGuestsOffered: z.boolean().default(false),
  maxGuestsWithExtra: z.number().int().min(1).max(50).nullable().optional(),
  extraGuestPricePerNight: z.number().int().min(0).max(100_000).nullable().optional(),
  cleaningFee: z.number().int().min(0).max(100_000).optional(),
  contacts: listingContactsSchema.optional(),
})

const refineListingExtraGuests = (
  data: z.infer<typeof listingFieldsBaseSchema>,
  ctx: z.RefinementCtx,
) => {
  const message = getListingExtraGuestsValidationError(data)

  if (message) {
    ctx.addIssue({ code: 'custom', message })
  }
}

export const listingFieldsSchema = listingFieldsBaseSchema

export type ListingFieldsInput = z.infer<typeof listingFieldsSchema>

export const createListingSchema = listingFieldsBaseSchema.extend({
  propertyListingId: z.string().uuid().optional(),
}).superRefine(refineListingExtraGuests)

export const createPropertyListingSchema = z.object({
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().max(5000).default(''),
  city: z.string().trim().min(2).max(128),
  address: z.string().trim().max(255).default(''),
  checkInTime: listingTimeSchema.default('15:00'),
  checkOutTime: listingTimeSchema.default('12:00'),
})

export const updateListingSchema = listingFieldsBaseSchema.partial()

export const updateListingStatusSchema = z.object({
  status: z.enum(LISTING_STATUSES),
})

export type CreateListingInput = z.infer<typeof createListingSchema>
export type CreatePropertyListingInput = z.infer<typeof createPropertyListingSchema>
export type UpdateListingInput = z.infer<typeof updateListingSchema>
