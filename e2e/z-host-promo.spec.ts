import { expect, test } from '@playwright/test'
import { getApiToken, HOST_EMAIL, loginWithOtp } from './helpers/auth'
import { resetE2eSeed } from './helpers/seed'

const MOSCOW_LISTING_TITLE = 'Уютная студия у метро'

test.describe('host promotion', () => {
  test.setTimeout(60_000)

  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('host purchases highlight and search shows enlarged card', async ({ page, request }) => {
    const token = await getApiToken(request, HOST_EMAIL)

    const account = await request.get('/api/host/promo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(account.ok()).toBeTruthy()
    const { balance } = await account.json() as { balance: number }
    expect(balance).toBeGreaterThanOrEqual(600)

    const hostListings = await request.get('/api/host/listings', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(hostListings.ok()).toBeTruthy()
    const listings = await hostListings.json() as { id: string, title: string, status: string }[]
    const listing = listings.find(item => item.title === MOSCOW_LISTING_TITLE && item.status === 'published')
    expect(listing).toBeTruthy()

    const purchase = await request.post(`/api/host/listings/${listing!.id}/promotions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productSlug: 'highlight' },
    })
    expect(purchase.ok()).toBeTruthy()

    const search = await request.get(`/api/search?city=${encodeURIComponent('Москва')}`)
    expect(search.ok()).toBeTruthy()
    const { items } = await search.json() as { items: { id: string, promotions?: { highlight?: boolean } }[] }
    const hit = items.find(item => item.id === listing!.id)
    expect(hit?.promotions?.highlight).toBe(true)

    await loginWithOtp(page, HOST_EMAIL)
    await page.goto(`/host/listings/${listing!.id}/promote`)
    await expect(page.getByText(/уже активно|already active/i)).toBeVisible()
    await expect(page.getByTestId('listing-promotion-highlight')).toHaveCount(0)

    await page.goto(`/search?city=${encodeURIComponent('Москва')}`)
    await expect(page.getByTestId('search-result-highlighted').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/рекомендуем|recommended/i)).toHaveCount(0)
  })
})
