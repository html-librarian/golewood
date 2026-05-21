import { z } from 'zod'

export const createBookingSchema = z.object({
  listingId: z.string().uuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(50),
  includeTransfer: z.boolean().default(false),
  bonusToApply: z.number().int().min(0).default(0),
  giftCertificateCode: z.string().trim().min(4).max(32).optional(),
}).refine(
  data => data.checkOut > data.checkIn,
  { message: 'checkOut must be after checkIn' },
)

export const calendarQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const createBlockSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine(
  data => data.endDate >= data.startDate,
  { message: 'endDate must be on or after startDate' },
)

export type CreateBookingInput = z.infer<typeof createBookingSchema>
