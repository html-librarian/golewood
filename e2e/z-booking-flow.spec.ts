import { expect, test } from '@playwright/test'
import { loginWithOtp } from './helpers/auth'
import { gotoReady } from './helpers/navigation'
import { resetE2eSeed } from './helpers/seed'

const LISTING_TITLE = 'Уютная студия у метро'
const CHECK_IN = '2026-07-10'
const CHECK_OUT = '2026-07-12'

test.describe('booking flow', () => {
  test.setTimeout(120_000)

  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('guest can search, book and pay (mock)', async ({ page, request }) => {
    const search = await request.get(`/api/search?city=${encodeURIComponent('Москва')}`)
    const { items } = await search.json() as { items: Array<{ id: string, title: string }> }
    const listing = items.find(item => item.title === LISTING_TITLE)

    expect(listing).toBeTruthy()

    await loginWithOtp(page)

    const sessionToken = (await page.context().cookies()).find(cookie => cookie.name === 'auth-access-token')?.value
    expect(sessionToken).toBeTruthy()

    const bookingRes = await request.post('/api/bookings', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Idempotency-Key': crypto.randomUUID(),
      },
      data: {
        listingId: listing!.id,
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        guests: 2,
      },
      timeout: 30_000,
    })
    expect(bookingRes.ok(), await bookingRes.text()).toBeTruthy()

    const booking = await bookingRes.json() as { id: string }

    const bookingGet = await request.get(`/api/bookings/${booking.id}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
      timeout: 15_000,
    })
    expect(bookingGet.ok(), await bookingGet.text()).toBeTruthy()

    await gotoReady(page, '/search?city=Москва')
    await expect(page.getByRole('link', { name: LISTING_TITLE })).toBeVisible()

    await gotoReady(page, `/bookings/${booking.id}/pay`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/оплат|payment/i, { timeout: 30_000 })
    await page.getByRole('button', { name: /перейти к оплате|proceed to payment/i }).click()
    await expect(page).toHaveURL(/return=1/)
    await expect(page.getByText(/оплата прошла успешно|payment successful/i)).toBeVisible()
  })
})
