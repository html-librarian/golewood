import { homePromoService } from '../../../services/home-promo.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing banner id' })
  }

  await homePromoService.delete(id)
  return { ok: true }
})
