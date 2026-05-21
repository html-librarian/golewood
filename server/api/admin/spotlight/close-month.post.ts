import { closeSpotlightMonthSchema } from '#shared/schemas/spotlight'
import { spotlightService } from '../../../services/spotlight.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const parsed = closeSpotlightMonthSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join('; '),
    })
  }

  return spotlightService.closeMonth(parsed.data.monthKey)
})
