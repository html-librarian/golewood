import type { CreateReportInput } from '#shared/schemas/admin'
import { authorizationHeaders } from '#shared/utils/auth-headers'
import type { Report } from '#shared/types/report'

export const useReports = () => {
  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const createReport = (input: CreateReportInput) =>
    $fetch<Report>('/api/reports', {
      method: 'POST',
      headers: authHeaders(),
      body: input,
    })

  return {
    createReport,
  }
}
