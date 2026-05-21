import type { H3Event } from 'h3'
import type { UserRole } from '#shared/types/user'
import { requireRole } from './auth'

const matchAdminPath = (path: string, prefixes: string[]) =>
  prefixes.some(prefix => path === prefix || path.startsWith(`${prefix}/`))

const SUPPORT_API_PREFIXES = [
  '/api/admin/reports',
  '/api/admin/support-requests',
]

const CONTENT_API_PREFIXES = [
  '/api/admin/cities',
  '/api/admin/blog',
  '/api/admin/listings/published',
]

const CONTENT_NEWS_API_PATTERN = /^\/api\/host\/listings\/[^/]+\/news/

export const resolveAdminApiRoles = (path: string): UserRole[] => {
  if (matchAdminPath(path, SUPPORT_API_PREFIXES)) {
    return ['admin', 'support']
  }

  if (matchAdminPath(path, CONTENT_API_PREFIXES) || CONTENT_NEWS_API_PATTERN.test(path)) {
    return ['admin', 'content_manager']
  }

  return ['admin']
}

export const requireAdminApiAccess = (event: H3Event) => {
  requireRole(event, resolveAdminApiRoles(event.path))
}
