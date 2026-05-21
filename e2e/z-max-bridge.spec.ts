import { expect, test } from '@playwright/test'
import { resetE2eSeed } from './helpers/seed'

const setSessionCookies = async (
  context: import('@playwright/test').BrowserContext,
  session: { accessToken: string, refreshToken: string, sessionId: string },
) => {
  await context.addCookies([
    {
      name: 'auth-access-token',
      value: session.accessToken,
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'auth-refresh-token',
      value: session.refreshToken,
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'auth-session-id',
      value: session.sessionId,
      domain: 'localhost',
      path: '/',
    },
  ])
}

test.describe('MAX mini-app (bridge mock)', () => {
  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('host bridge-mock opens /max dashboard', async ({ page, request }) => {
    const bridge = await request.post('/api/auth/max/bridge-mock', {
      data: { maxUserId: 9_000_000_002 },
    })
    expect(bridge.ok(), await bridge.text()).toBeTruthy()

    const session = await bridge.json() as {
      accessToken: string
      refreshToken: string
      sessionId: string
      user: { role: string }
    }
    expect(session.user.role).toBe('host')

    await setSessionCookies(page.context(), session)
    await page.goto('/max')
    await expect(page.getByRole('heading', { name: /кабинет хоста|host dashboard/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: /бронирования|bookings/i })).toBeVisible()
  })

  test('guest bridge-mock opens /max guest home', async ({ page, request }) => {
    const bridge = await request.post('/api/auth/max/bridge-mock', {
      data: { maxUserId: 9_000_000_003 },
    })
    expect(bridge.ok(), await bridge.text()).toBeTruthy()

    const session = await bridge.json() as {
      accessToken: string
      refreshToken: string
      sessionId: string
      user: { role: string }
    }
    expect(session.user.role).toBe('guest')

    await setSessionCookies(page.context(), session)
    await page.goto('/max')
    await expect(page.getByRole('heading', { name: /мои брони|my bookings/i })).toBeVisible({ timeout: 15_000 })
  })

  test('startapp=bookings deep link highlights booking for host', async ({ page, request }) => {
    const bridge = await request.post('/api/auth/max/bridge-mock', {
      data: { maxUserId: 9_000_000_002 },
    })
    expect(bridge.ok(), await bridge.text()).toBeTruthy()

    const session = await bridge.json() as {
      accessToken: string
      refreshToken: string
      sessionId: string
    }

    const bookingsRes = await request.get('/api/host/bookings', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
    expect(bookingsRes.ok()).toBeTruthy()
    const bookings = await bookingsRes.json() as Array<{ id: string, status: string }>
    const pending = bookings.find(booking => booking.status === 'pending')
    expect(pending).toBeTruthy()

    await setSessionCookies(page.context(), session)
    await page.goto(`/max/bookings?startapp=booking_${pending!.id}`)
    await page.waitForURL(/[?&]booking=/)
    await expect(page.getByTestId('max-booking-highlighted')).toBeVisible({ timeout: 20_000 })
  })
})
