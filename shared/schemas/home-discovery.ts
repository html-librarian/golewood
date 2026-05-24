import { z } from 'zod'
import { isValidDiscoveryTone } from '#shared/catalog/home-discovery-tones'

const discoveryParamsSchema = z.object({
  city: z.string().trim().min(1).max(128).optional(),
  amenities: z.array(z.string().trim().min(1).max(64)).optional(),
  teamBadgeSlugs: z.array(z.string().trim().min(1).max(64)).optional(),
  accommodationTypes: z.array(z.string().trim().min(1).max(64)).optional(),
})

const toneSchema = z.string().trim().min(7).max(160).refine(isValidDiscoveryTone, {
  message: 'Invalid tone (use preset gradient classes, e.g. from-sky-400 to-cyan-600)',
})

export const HOME_DISCOVERY_GROUP_IDS = ['destinations', 'comfort', 'nature'] as const

export const updateHomeDiscoveryItemSchema = z.object({
  icon: z.string().trim().min(3).max(128).optional(),
  tone: toneSchema.optional(),
  labelRu: z.string().trim().min(1).max(128).optional(),
  labelEn: z.string().trim().min(1).max(128).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  params: discoveryParamsSchema.optional(),
  imageUrl: z.string().trim().url().max(512).nullable().optional(),
})

export const createHomeDiscoveryItemSchema = z.object({
  groupId: z.enum(HOME_DISCOVERY_GROUP_IDS),
  itemKey: z.string().trim().min(2).max(64).regex(/^[a-z0-9-]+$/),
  labelRu: z.string().trim().min(1).max(128),
  labelEn: z.string().trim().min(1).max(128),
  icon: z.string().trim().min(3).max(128).default('ph:star-duotone'),
  tone: toneSchema.default('from-brand-500 to-brand-700'),
  params: discoveryParamsSchema,
})

export const moveHomeDiscoveryItemSchema = z.object({
  direction: z.enum(['up', 'down']),
})

export type UpdateHomeDiscoveryItemInput = z.infer<typeof updateHomeDiscoveryItemSchema>
export type CreateHomeDiscoveryItemInput = z.infer<typeof createHomeDiscoveryItemSchema>
