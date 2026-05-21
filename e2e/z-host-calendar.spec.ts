import { expect, test } from '@playwright/test'
import { getApiToken, HOST_EMAIL, loginWithOtp } from './helpers/auth'
import { resetE2eSeed } from './helpers/seed'

const STUDIO_TITLE = 'Уютная студия у метро'
const BLOCK_START = '2026-10-10'
const BLOCK_END = '2026-10-12'

test.describe('host calendar', () => {
  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('host can block dates and guest cannot book them', async ({ page, request }) => {
    await loginWithOtp(page, HOST_EMAIL)

    await page.goto('/host/listings')
    const studioCard = page.locator('.space-y-2').filter({ has: page.getByRole('link', { name: STUDIO_TITLE }) })
    await studioCard.getByRole('link', { name: /календар|calendar/i }).click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/календар|calendar/i)

    await page.locator('input[type="date"]').nth(0).fill(BLOCK_START)
    await page.locator('input[type="date"]').nth(1).fill(BLOCK_END)
    await page.getByRole('button', { name: /заблокировать|block dates|submit/i }).click()

    await expect(page.getByText(`${BLOCK_START} — ${BLOCK_END}`).first()).toBeVisible()

    const search = await request.get(`/api/search?city=${encodeURIComponent('Москва')}`)
    const { items } = await search.json() as { items: Array<{ id: string, title: string }> }
    const listing = items.find(item => item.title === STUDIO_TITLE)
    expect(listing).toBeTruthy()

    const guestToken = await getApiToken(request)
    const bookingRes = await request.post('/api/bookings', {
      headers: {
        Authorization: `Bearer ${guestToken}`,
        'Idempotency-Key': crypto.randomUUID(),
      },
      data: {
        listingId: listing!.id,
        checkIn: BLOCK_START,
        checkOut: '2026-10-13',
        guests: 2,
      },
    })

    expect(bookingRes.status()).toBe(409)
  })
})
