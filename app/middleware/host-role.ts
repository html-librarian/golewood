/** Гость может: обзор /host, объявления, создание, справка. Остальное — только role host|admin. */
export default defineNuxtRouteMiddleware((to) => {
  const { user, fetchMe } = useAuth()
  const localePath = useLocalePath()

  const ensureUser = async () => {
    if (!user.value) {
      await fetchMe()
    }
  }

  return ensureUser().then(() => {
    const role = user.value?.role
    if (role === 'host' || role === 'admin') {
      return
    }

    const path = to.path
    const guestAllowed
      = path === localePath('/host')
        || path.startsWith(localePath('/host/listings'))
        || path.startsWith(localePath('/host/properties'))
        || path.startsWith(localePath('/host/guide'))

    if (!guestAllowed) {
      return navigateTo(localePath('/host'))
    }
  })
})
