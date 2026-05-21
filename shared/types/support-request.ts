import type { ReportStatus } from './report'

export type SupportRequest = {
  id: string
  name: string
  email: string
  contextUrl: string | null
  message: string
  status: ReportStatus
  staffNote: string
  createdAt: string
  updatedAt: string
}
