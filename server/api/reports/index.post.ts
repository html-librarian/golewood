import { createReportSchema } from '#shared/schemas/admin'
import { requireAuth } from '../../utils/auth'
import { reportService } from '../../services/report.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const input = createReportSchema.parse(body)
  const report = await reportService.create(user.id, input)

  setResponseStatus(event, 201)

  return report
})
