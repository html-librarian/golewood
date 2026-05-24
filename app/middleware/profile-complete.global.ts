import { needsProfileCompletion } from '#shared/utils/user-display'

export default defineNuxtRouteMiddleware(async (to) => {
  const localePath = useLocalePath()
  const { user, isAuthenticated, fetchMe } = useAuth()

  if (!isAuthenticated.value) {
    await fetchMe()
  }

  if (!isAuthenticated.value || !user.value || !needsProfileCompletion(user.value)) {
    return
  }

  const completePath = localePath('/auth/complete-profile')

  if (to.path === completePath || to.path.startsWith(`${completePath}/`)) {
    return
  }

  return navigateTo(completePath)
})
