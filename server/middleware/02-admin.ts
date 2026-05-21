import { requireAdminApiAccess } from '../utils/admin-access'
import { requireRole } from '../utils/auth'

const CONTENT_NEWS_API_PATTERN = /^\/api\/host\/listings\/[^/]+\/news/

export default defineEventHandler((event) => {
  if (event.path.startsWith('/api/admin')) {
    requireAdminApiAccess(event)
    return
  }

  if (CONTENT_NEWS_API_PATTERN.test(event.path)) {
    requireRole(event, ['host', 'admin', 'content_manager'])
  }
})
