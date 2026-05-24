import { updateHomeHeroSettingsSchema } from '#shared/schemas/home-hero'
import { homeHeroService } from '../../../services/home-hero.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = updateHomeHeroSettingsSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return homeHeroService.updateSettings(parsed.data)
})
