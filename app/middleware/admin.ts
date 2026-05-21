import type { UserRole } from '#shared/types/user'
import { canAccessAdminPanel } from '#shared/utils/user-roles'

const defaultHomeForRole = (role: UserRole) => {
  if (role === 'support') {
    return '/admin/support-requests'
  }

  if (role === 'content_manager') {
    return '/admin/cities'
  }

  return '/admin'
}

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchMe } = useAuth()

  if (!user.value) {
    await fetchMe()
  }

  const role = user.value?.role

  if (!canAccessAdminPanel(role)) {
    return navigateTo('/')
  }

  const allowed = (to.meta.staffRoles as UserRole[] | undefined) ?? ['admin']

  if (!role || !allowed.includes(role)) {
    return navigateTo(defaultHomeForRole(role))
  }
})
