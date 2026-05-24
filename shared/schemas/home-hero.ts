import { z } from 'zod'
import { HOME_HERO_MODES } from '#shared/types/home-hero'

export const updateHomeHeroSettingsSchema = z.object({
  mode: z.enum(HOME_HERO_MODES).optional(),
  creditRu: z.string().trim().max(255).nullable().optional(),
  creditEn: z.string().trim().max(255).nullable().optional(),
})

export type UpdateHomeHeroSettingsInput = z.infer<typeof updateHomeHeroSettingsSchema>
