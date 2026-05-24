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

  const form = await readMultipartFormData(event)
  const file = form?.find(item => item.name === 'file' && item.data)

  if (!file?.data) {
    throw createError({ statusCode: 400, statusMessage: 'File is required' })
  }

  return homePromoService.uploadImage(id, breakpointRaw as HomePromoImageBreakpoint, {
    data: file.data,
    filename: file.filename,
    type: file.type,
  })
})
