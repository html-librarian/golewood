import { expect, test } from '@playwright/test'
import { HOST_EMAIL, loginWithOtp } from './helpers/auth'
import { resetE2eSeed } from './helpers/seed'

const PENDING_LISTING = 'Уютная студия у метро'

const NEVA_LISTING = 'Двухкомнатная у Невы'

test.describe('host bookings', () => {
  test.setTimeout(60_000)

  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('host can confirm pending booking', async ({ page }) => {
    await loginWithOtp(page, HOST_EMAIL)

    await page.goto('/host/bookings')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/бронирован|bookings/i, { timeout: 15_000 })

    const bookingCard = page.locator('article').filter({ hasText: '2026-08-15' })
    await expect(bookingCard.getByRole('heading', { name: PENDING_LISTING })).toBeVisible()
    await bookingCard.getByRole('button', { name: /подтвердить|confirm/i }).click()
    await expect(bookingCard.getByRole('button', { name: /завершить|complete/i })).toBeVisible()
  })

  test('host can complete confirmed booking', async ({ page }) => {
    await loginWithOtp(page, HOST_EMAIL)

    await page.goto('/host/bookings')
    const bookingCard = page.locator('article').filter({ hasText: '2026-04-03' })
    await expect(bookingCard.getByRole('heading', { name: NEVA_LISTING })).toBeVisible()
    await bookingCard.getByRole('button', { name: /завершить|complete/i }).click()
    await expect(bookingCard.getByText(/заверш|completed/i)).toBeVisible()
  })

  test('host can filter bookings by status', async ({ page }) => {
    await loginWithOtp(page, HOST_EMAIL)

    await page.goto('/host/bookings')
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
