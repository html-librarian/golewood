import { reportService } from '../../../services/report.service'

export default defineEventHandler(async () => reportService.listForAdmin())
