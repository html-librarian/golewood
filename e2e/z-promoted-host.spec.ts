import { expect, test } from '@playwright/test'
import { ADMIN_EMAIL, GUEST_EMAIL, loginWithOtp } from './helpers/auth'
import { E2E_LISTING_TITLE, fillListingWizard } from './helpers/listing'
import { resetE2eSeed } from './helpers/seed'

test.describe('promoted host', () => {
  test.setTimeout(90_000)

  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('guest promoted by admin can create listing', async ({ page }) => {
    await loginWithOtp(page, ADMIN_EMAIL)

    await page.goto('/admin/users')
    const guestCard = page.locator('article').filter({ hasText: '+79000000003' })
    await guestCard.locator('select').selectOption('host')
    await guestCard.getByRole('button', { name: /сохранить|save/i }).click()
    await expect(guestCard.locator('select')).toHaveValue('host')

    await page.context().clearCookies()
    await loginWithOtp(page, GUEST_EMAIL)

    await page.goto('/host/listings')
    await expect(page.getByText(/нет объявлен|no listings/i)).toBeVisible()

    await page.goto('/host/listings/create')
    await fillListingWizard(page, `${E2E_LISTING_TITLE} Guest`)

    await expect(page.getByRole('link', { name: `${E2E_LISTING_TITLE} Guest` })).toBeVisible({ timeout: 15_000 })
  })
})
