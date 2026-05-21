import { adminUserService } from '../../../services/admin-user.service'

export default defineEventHandler(async () => adminUserService.list())
