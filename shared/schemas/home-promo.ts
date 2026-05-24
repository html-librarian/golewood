import { z } from 'zod'
import { isValidDiscoveryTone } from '#shared/catalog/home-discovery-tones'

const toneSchema = z.string().trim().min(7).max(160).refine(isValidDiscoveryTone, {
  message: 'Invalid tone (use preset gradient classes, e.g. from-sky-400 to-cyan-600)',
})

const linkHrefSchema = z.string().trim().min(1).max(512).refine(
  value => value.startsWith('/') || /^https?:\/\//i.test(value),
  { message: 'Link must start with / or http(s)://' },
)

export const HOME_PROMO_SLOTS = ['featured', 'carousel'] as const
export const HOME_PROMO_IMAGE_BREAKPOINTS = ['desktop', 'tablet', 'mobile'] as const

export const createHomePromoBannerSchema = z.object({
  slot: z.enum(HOME_PROMO_SLOTS),
  titleRu: z.string().trim().max(255).nullable().optional(),
  titleEn: z.string().trim().max(255).nullable().optional(),
  subtitleRu: z.string().trim().max(255).nullable().optional(),
  subtitleEn: z.string().trim().max(255).nullable().optional(),
  ctaRu: z.string().trim().max(64).nullable().optional(),
  ctaEn: z.string().trim().max(64).nullable().optional(),
  linkHref: linkHrefSchema,
  linkExternal: z.boolean().optional(),
  backgroundMode: z.enum(['image', 'gradient']).optional(),
  tone: toneSchema.optional(),
  active: z.boolean().optional(),
})

export const updateHomePromoBannerSchema = z.object({
  titleRu: z.string().trim().max(255).nullable().optional(),
  titleEn: z.string().trim().max(255).nullable().optional(),
  subtitleRu: z.string().trim().max(255).nullable().optional(),
  subtitleEn: z.string().trim().max(255).nullable().optional(),
  ctaRu: z.string().trim().max(64).nullable().optional(),
  ctaEn: z.string().trim().max(64).nullable().optional(),
  linkHref: linkHrefSchema.optional(),
  linkExternal: z.boolean().optional(),
  backgroundMode: z.enum(['image', 'gradient']).optional(),
  tone: toneSchema.optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
})

export const moveHomePromoBannerSchema = z.object({
  direction: z.enum(['up', 'down']),
})

export type CreateHomePromoBannerInput = z.infer<typeof createHomePromoBannerSchema>
export type UpdateHomePromoBannerInput = z.infer<typeof updateHomePromoBannerSchema>
