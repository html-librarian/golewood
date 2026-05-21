import { z } from 'zod'
import { phoneSchema } from './auth'

export const createListingClaimSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: phoneSchema,
  email: z.preprocess(
    (value) => (typeof value === 'string' && !value.trim() ? undefined : value),
    z.string().email().max(255).optional(),
  ),
  message: z.string().trim().max(2000).optional(),
})

export const approveListingClaimSchema = z.object({
  hostUserId: z.string().uuid().optional(),
  assignRequesterAsHost: z.boolean().optional(),
}).refine(
  data => Boolean(data.hostUserId) || data.assignRequesterAsHost === true,
  { message: 'hostUserId or assignRequesterAsHost is required' },
)

export const updateListingOwnershipSchema = z.object({
  managedByTeam: z.boolean().optional(),
  hostId: z.string().uuid().optional(),
})

export type CreateListingClaimInput = z.infer<typeof createListingClaimSchema>
export type ApproveListingClaimInput = z.infer<typeof approveListingClaimSchema>
export type UpdateListingOwnershipInput = z.infer<typeof updateListingOwnershipSchema>
