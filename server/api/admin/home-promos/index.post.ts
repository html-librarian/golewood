import { createHomePromoBannerSchema } from '#shared/schemas/home-promo'
import { homePromoService } from '../../../services/home-promo.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = createHomePromoBannerSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return homePromoService.create(parsed.data)
})
