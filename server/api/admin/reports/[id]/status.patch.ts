import { updateReportStatusSchema } from '#shared/schemas/admin'
import { reportService } from '../../../../services/report.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing report id' })
  }

  const body = await readBody(event)
  const { status, adminNote } = updateReportStatusSchema.parse(body)

  return reportService.updateStatus(id, status, adminNote)
})
