import { expect, test } from '@playwright/test'
import { HOST_EMAIL, loginWithOtp } from './helpers/auth'
import { resetE2eSeed } from './helpers/seed'

const DEMO_LISTINGS = [
  'Уютная студия у метро',
  'Двухкомнатная у Невы',
  'Лофт на модерации',
  'Черновик на Арбате',
]

test.describe('host flow', () => {
  test.setTimeout(60_000)

  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('host sees demo listings with photos', async ({ page }) => {
    await loginWithOtp(page, HOST_EMAIL)

    await Promise.all([
      page.waitForResponse(response =>
        response.request().method() === 'GET'
        && response.url().endsWith('/api/host/listings')
        && response.ok(),
      ),
      page.goto('/host/listings'),
    ])
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/объявлен|listings/i)

    for (const title of DEMO_LISTINGS) {
      await expect(page.getByRole('link', { name: title })).toBeVisible()
    }

    const firstCard = page.locator('a').filter({ hasText: DEMO_LISTINGS[0] })
    await expect(firstCard).toBeVisible()
    await expect(firstCard.getByRole('img')).toBeVisible()
  })

  test('host dashboard shows stats', async ({ page, request }) => {
    await loginWithOtp(page, HOST_EMAIL)

    await page.goto('/host')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/кабинет|dashboard/i, { timeout: 15_000 })
    await expect(page.getByRole('navigation').getByRole('link', { name: /объявлен|listings/i })).toBeVisible()

    const token = (await page.context().cookies()).find(cookie => cookie.name === 'auth-access-token')?.value
    const stats = await request.get('/api/host/stats', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30_000,
    })
    expect(stats.ok()).toBeTruthy()

    const body = await stats.json() as {
      listingsPublished: number
      bookingsPending: number
      bookingsUpcoming: number
    }
    expect(body.listingsPublished).toBeGreaterThanOrEqual(2)
    expect(body.bookingsPending).toBeGreaterThanOrEqual(1)
    expect(body.bookingsUpcoming).toBeGreaterThanOrEqual(2)

    await expect(page.getByText(String(body.listingsPublished)).first()).toBeVisible()
    await expect(page.getByText(String(body.bookingsPending)).first()).toBeVisible()
  })
})
