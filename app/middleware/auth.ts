export default defineNuxtRouteMiddleware(async () => {
  const localePath = useLocalePath()
  const { isAuthenticated, fetchMe } = useAuth()

  if (!isAuthenticated.value) {
    await fetchMe()
  }

  if (!isAuthenticated.value) {
    return navigateTo(localePath('/auth/login'))
  }
})
