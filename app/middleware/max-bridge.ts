import { parseMaxBotStart } from '#shared/utils/max-links'

export default defineNuxtRouteMiddleware(async (to) => {
  const localePath = useLocalePath()
  const { ensureSession, needsLink } = useMaxBridge()
  const { isAuthenticated, user } = useAuth()

  await ensureSession()

  if (needsLink.value) {
    return
  }

  if (!isAuthenticated.value) {
    return navigateTo(localePath('/auth/login'))
  }

  if (user.value && !['guest', 'host', 'admin'].includes(user.value.role)) {
    return navigateTo(localePath('/'))
  }

  const startRaw = to.query.startapp?.toString()
    ?? to.query.start?.toString()
    ?? null

  if (!startRaw) {
    return
  }

  const intent = parseMaxBotStart(startRaw)
  const bookingsPath = localePath('/max/bookings')

  if (intent.kind === 'bookings') {
    if (to.path !== bookingsPath) {
      return navigateTo(bookingsPath)
    }

    return
  }

  if (intent.kind === 'booking') {
    const currentBooking =
      typeof to.query.booking === 'string' ? to.query.booking : null

    if (to.path !== bookingsPath) {
      return navigateTo(localePath({
        path: '/max/bookings',
        query: { booking: intent.bookingId },
      }))
    }

    if (currentBooking !== intent.bookingId) {
      const { startapp: _startapp, start: _start, ...rest } = to.query

      return navigateTo(localePath({
        path: '/max/bookings',
        query: { ...rest, booking: intent.bookingId },
      }))
    }
  }
})
