import { z } from 'zod'

export const createTeamBadgeSchema = z.object({
  slug: z.string().trim().min(2).max(64).regex(/^[a-z0-9_]+$/),
  icon: z.string().trim().min(3).max(128),
  titleRu: z.string().trim().min(1).max(128),
  titleEn: z.string().trim().min(1).max(128),
  descriptionRu: z.string().trim().max(2000).default(''),
  descriptionEn: z.string().trim().max(2000).default(''),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
})

export const updateTeamBadgeSchema = createTeamBadgeSchema.partial()

export const assignListingTeamBadgeSchema = z.object({
  teamBadgeId: z.string().uuid().nullable(),
  blogPostId: z.string().uuid().nullable().optional(),
})

export type CreateTeamBadgeInput = z.infer<typeof createTeamBadgeSchema>
export type UpdateTeamBadgeInput = z.infer<typeof updateTeamBadgeSchema>
export type AssignListingTeamBadgeInput = z.infer<typeof assignListingTeamBadgeSchema>
