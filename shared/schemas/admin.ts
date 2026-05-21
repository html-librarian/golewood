import { z } from 'zod'

export const createReportSchema = z.object({
  type: z.enum(['listing', 'booking', 'user', 'other']),
  listingId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  targetUserId: z.string().uuid().optional(),
  reason: z.string().trim().min(10).max(2000),
})

export const updateReportStatusSchema = z.object({
  status: z.enum(['in_progress', 'resolved', 'dismissed']),
  adminNote: z.string().trim().max(2000).optional(),
})

export const updateUserRoleSchema = z.object({
  role: z.enum(['guest', 'host', 'admin', 'support', 'content_manager']),
})

export const updateSupportRequestStatusSchema = z.object({
  status: z.enum(['in_progress', 'resolved', 'dismissed']),
  staffNote: z.string().trim().max(2000).optional(),
})

export type CreateReportInput = z.infer<typeof createReportSchema>
