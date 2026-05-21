import { z } from 'zod'
import { HOST_LEGAL_TYPES } from '#shared/types/host-verification'

export const upsertHostVerificationSchema = z.object({
  isVerified: z.boolean(),
  legalType: z.enum(HOST_LEGAL_TYPES),
  legalName: z.string().trim().min(2).max(255),
  inn: z.string().trim().regex(/^\d{10}(\d{2})?$/),
  ogrn: z.string().trim().regex(/^\d{13,15}$/).optional().nullable(),
  legalAddress: z.string().trim().min(5).max(2000),
  workingHoursNote: z.string().trim().max(500).optional(),
})

export type UpsertHostVerificationInput = z.infer<typeof upsertHostVerificationSchema>
