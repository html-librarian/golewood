import { expect, test } from '@playwright/test'
import { HOST_EMAIL, loginWithOtp } from './helpers/auth'
import { E2E_LISTING_TITLE, fillListingWizard } from './helpers/listing'
import { resetE2eSeed } from './helpers/seed'

test.describe('host create listing', () => {
  test.setTimeout(90_000)

  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('host can create listing with photo upload', async ({ page }) => {
    await loginWithOtp(page, HOST_EMAIL)

    await page.goto('/host/listings/create')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/объявлен|listing/i)

    await fillListingWizard(page)

    await expect(page.getByRole('link', { name: E2E_LISTING_TITLE })).toBeVisible({ timeout: 15_000 })
    const card = page.locator('.space-y-2').filter({ has: page.getByRole('link', { name: E2E_LISTING_TITLE }) })
    await expect(card.getByText(/модерац|moderation/i)).toBeVisible()
  })
})
