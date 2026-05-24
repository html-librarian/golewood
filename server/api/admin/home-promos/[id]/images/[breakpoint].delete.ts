import { HOME_PROMO_IMAGE_BREAKPOINTS } from '#shared/schemas/home-promo'
import type { HomePromoImageBreakpoint } from '#shared/types/home-promo'
import { homePromoService } from '../../../../../services/home-promo.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const breakpointRaw = getRouterParam(event, 'breakpoint')

  if (!id || !breakpointRaw) {
    throw createError({ statusCode: 400, statusMessage: 'Missing banner id or breakpoint' })
  }

  if (!HOME_PROMO_IMAGE_BREAKPOINTS.includes(breakpointRaw as HomePromoImageBreakpoint)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid breakpoint' })
  }

  return homePromoService.clearImage(id, breakpointRaw as HomePromoImageBreakpoint)
})
