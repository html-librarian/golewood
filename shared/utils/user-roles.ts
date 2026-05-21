import type { UserRole } from '#shared/types/user'

export const ADMIN_PANEL_ROLES = ['admin', 'support', 'content_manager'] as const satisfies readonly UserRole[]

export const STAFF_ASSIGNABLE_ROLES = ['support', 'content_manager'] as const satisfies readonly UserRole[]

export const canAccessAdminPanel = (role: UserRole | undefined): role is (typeof ADMIN_PANEL_ROLES)[number] =>
  role !== undefined && (ADMIN_PANEL_ROLES as readonly UserRole[]).includes(role)

export const canManageSupportQueue = (role: UserRole | undefined) =>
  role === 'admin' || role === 'support'

export const canManageContent = (role: UserRole | undefined) =>
  role === 'admin' || role === 'content_manager'

export const isHostCapableRole = (role: UserRole | undefined) =>
  role === 'host' || role === 'admin'
