import { expect, test } from '@playwright/test'
import { HOST_EMAIL, loginWithOtp } from './helpers/auth'
import { archiveHostListingByTitle, DRAFT_LISTING_TITLE } from './helpers/host-listings'
import { resetE2eSeed } from './helpers/seed'

const DRAFT_TITLE = DRAFT_LISTING_TITLE

test.describe('host archive listing', () => {
  test.setTimeout(60_000)

  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('host can archive draft listing', async ({ page, request }) => {
    await loginWithOtp(page, HOST_EMAIL)
    await page.goto('/host/listings')

    await archiveHostListingByTitle(page, request, DRAFT_TITLE)

    const draftCard = page.locator('.space-y-2').filter({ has: page.getByRole('link', { name: DRAFT_TITLE }) })
    await expect(draftCard.getByRole('button', { name: /восстанов|restore/i })).toBeVisible()
    await expect(draftCard.getByRole('link', { name: /редактир|edit/i })).toBeHidden()
  })

  test('host can restore archived listing', async ({ page, request }) => {
    await loginWithOtp(page, HOST_EMAIL)
    await page.goto('/host/listings')

    await archiveHostListingByTitle(page, request, DRAFT_TITLE)

    const draftCard = page.locator('.space-y-2').filter({ has: page.getByRole('link', { name: DRAFT_TITLE }) })
    await draftCard.getByRole('button', { name: /восстанов|restore/i }).click()
    await page.getByRole('button', { name: /активн|active/i }).click()
    await expect(draftCard.getByText('Черновик', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(draftCard.getByRole('link', { name: 'Редактировать' })).toBeVisible()
  })

  test('host can filter archived listings', async ({ page, request }) => {
    await loginWithOtp(page, HOST_EMAIL)
    await page.goto('/host/listings')

    await archiveHostListingByTitle(page, request, DRAFT_TITLE)

    await page.getByRole('button', { name: /активн|active/i }).click()
    await expect(page.getByRole('link', { name: DRAFT_TITLE })).toBeHidden()

    await page.getByRole('button', { name: /^в архиве$|^archived$/i }).click()
    await expect(page.getByRole('link', { name: DRAFT_TITLE })).toBeVisible()
  })
})
