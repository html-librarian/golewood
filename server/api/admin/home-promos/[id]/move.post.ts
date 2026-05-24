import { moveHomePromoBannerSchema } from '#shared/schemas/home-promo'
import { homePromoService } from '../../../../services/home-promo.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing banner id' })
  }

  const body = await readBody(event)
  const parsed = moveHomePromoBannerSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return homePromoService.move(id, parsed.data.direction)
})
