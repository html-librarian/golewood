import { requireRole } from '../../utils/auth'
import { adminService } from '../../services/admin.service'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])

  return await adminService.getDashboard()
})
