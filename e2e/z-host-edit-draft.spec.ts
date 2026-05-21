import { expect, test } from '@playwright/test'
import { HOST_EMAIL, getApiToken, loginWithOtp } from './helpers/auth'
import { resetE2eSeed } from './helpers/seed'

const DRAFT_TITLE = 'Черновик на Арбате'
const UPDATED_TITLE = 'E2E Updated Draft'

const waitForHostListings = (page: import('@playwright/test').Page) =>
  page.waitForResponse(response =>
    response.request().method() === 'GET'
    && response.url().endsWith('/api/host/listings')
    && response.ok(),
  )

test.describe('host edit draft', () => {
  test.setTimeout(60_000)

  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('host can edit draft listing title', async ({ page, request }) => {
    await loginWithOtp(page, HOST_EMAIL)

    await Promise.all([
      waitForHostListings(page),
      page.goto('/host/listings'),
    ])

    const draftCard = page.locator('.space-y-2').filter({ has: page.getByRole('link', { name: DRAFT_TITLE }) })
    const editLink = draftCard.getByRole('link', { name: /редактир|edit/i })
    const listingId = new URL(await editLink.getAttribute('href') ?? '', 'http://localhost:3000').searchParams.get('id')!
    expect(listingId).toBeTruthy()

    const token = await getApiToken(request, HOST_EMAIL)
    const listingRes = await request.get(`/api/host/listings/${listingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(listingRes.ok()).toBeTruthy()
    const listing = await listingRes.json() as {
      title: string
      city: string
      address: string
      description: string
      status: string
    }
    expect(listing.status).toBe('draft')

    const patchRes = await request.patch(`/api/host/listings/${listingId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: UPDATED_TITLE,
        city: listing.city,
        address: listing.address,
        description: listing.description,
      },
    })
    expect(patchRes.ok(), await patchRes.text()).toBeTruthy()

    await page.goto(`/host/listings/create?id=${listingId}`)
    await expect(page).toHaveURL(/\/host\/listings\/create\?id=/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/редактир|edit listing/i)
    await expect(page.getByLabel(/назван|title/i)).toHaveValue(UPDATED_TITLE, { timeout: 15_000 })

    await Promise.all([
      waitForHostListings(page),
      page.goto('/host/listings'),
    ])
    await expect(page.getByRole('link', { name: UPDATED_TITLE })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: DRAFT_TITLE })).toBeHidden()
  })
})
