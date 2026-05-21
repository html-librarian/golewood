import { expect, test } from '@playwright/test'
import { GUEST_EMAIL, loginWithOtp } from './helpers/auth'
import { resetE2eSeed } from './helpers/seed'

const PENDING_LISTING = 'Уютная студия у метро'

test.describe('guest bookings', () => {
  test.setTimeout(60_000)

  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('guest sees pending booking with pay action', async ({ page }) => {
    await loginWithOtp(page, GUEST_EMAIL)

    await page.goto('/bookings')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/бронирован|bookings/i, { timeout: 15_000 })

    const bookingCard = page.locator('article').filter({ hasText: '2026-08-15' })
    await expect(bookingCard.getByRole('heading', { name: PENDING_LISTING })).toBeVisible()
    await expect(bookingCard.getByRole('link', { name: /оплатить|pay/i })).toBeVisible()
  })

  test('guest can cancel pending booking', async ({ page }) => {
    await loginWithOtp(page, GUEST_EMAIL)

    await page.goto('/bookings')
    const bookingCard = page.locator('article').filter({ hasText: '2026-08-15' })
    await expect(bookingCard).toBeVisible()
    await bookingCard.getByRole('button', { name: /отменить|cancel/i }).click()
    await expect(bookingCard.getByText(/отмен|cancelled/i)).toBeVisible()
    await expect(bookingCard.getByRole('link', { name: /оплатить|pay/i })).toBeHidden()
  })

  test('guest can filter bookings by status', async ({ page }) => {
    await loginWithOtp(page, GUEST_EMAIL)

    await page.goto('/bookings')
    await expect(page.getByText('2026-08-15')).toBeVisible()
    await expect(page.getByText('2026-04-12')).toBeVisible()

    await page.getByRole('button', { name: /предстоя|upcoming/i }).click()
    await expect(page.getByText('2026-08-15')).toBeVisible()
    await expect(page.getByText('2026-04-12')).toBeHidden()

    await page.getByRole('button', { name: /прошед|past/i }).click()
    await expect(page.getByText('2026-08-15')).toBeHidden()
    await expect(page.getByText('2026-04-12')).toBeVisible()
  })
})
