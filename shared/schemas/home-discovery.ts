import { z } from 'zod'
import { isValidDiscoveryTone } from '#shared/catalog/home-discovery-tones'

const discoveryParamsSchema = z.object({
  city: z.string().trim().min(1).max(128).optional(),
  amenities: z.array(z.string().trim().min(1).max(64)).optional(),
  teamBadgeSlugs: z.array(z.string().trim().min(1).max(64)).optional(),
  accommodationTypes: z.array(z.string().trim().min(1).max(64)).optional(),
})

export const updateHomeDiscoveryItemSchema = z.object({
  icon: z.string().trim().min(3).max(128).optional(),
  tone: z.string().trim().min(7).max(160).refine(isValidDiscoveryTone, {
    message: 'Invalid tone (use preset gradient classes, e.g. from-sky-400 to-cyan-600)',
  }).optional(),
  labelRu: z.string().trim().min(1).max(128).optional(),
  labelEn: z.string().trim().min(1).max(128).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  params: discoveryParamsSchema.optional(),
})

export type UpdateHomeDiscoveryItemInput = z.infer<typeof updateHomeDiscoveryItemSchema>
