import { z } from 'zod'

export const upsertHostPayoutProfileSchema = z.object({
  inn: z.string().trim().regex(/^\d{10}$|^\d{12}$/, 'Invalid INN'),
  bankAccount: z.string().trim().regex(/^\d{20}$/, 'Account must be 20 digits'),
  bik: z.string().trim().regex(/^\d{9}$/, 'BIK must be 9 digits'),
})

export type UpsertHostPayoutProfileInput = z.infer<typeof upsertHostPayoutProfileSchema>

export const adminHostPayoutDecisionSchema = z.object({
  status: z.enum(['active', 'rejected']),
  yookassaRecipientId: z.string().trim().min(1).max(64).optional(),
  rejectionReason: z.string().trim().max(500).optional(),
}).superRefine((value, ctx) => {
  if (value.status === 'active' && !value.yookassaRecipientId) {
    ctx.addIssue({
      code: 'custom',
      message: 'yookassaRecipientId is required when activating',
      path: ['yookassaRecipientId'],
    })
  }
})

export type AdminHostPayoutDecisionInput = z.infer<typeof adminHostPayoutDecisionSchema>
