import { expect, test } from '@playwright/test'
import { GUEST_EMAIL, HOST_EMAIL, getApiToken, loginWithOtp } from './helpers/auth'
import { E2E_GIFT_CERTIFICATE_CODE } from './helpers/gift-certificate'
import { findPublishedListing } from './helpers/listing'
import { gotoReady } from './helpers/navigation'
import { resetE2eSeed } from './helpers/seed'

const LISTING_TITLE = 'Уютная студия у метро'
const CHECK_IN = '2026-07-20'
const CHECK_OUT = '2026-07-22'

test.describe('gift certificate booking', () => {
  test.setTimeout(120_000)

  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('redeem-preview and booking apply certificate credit', async ({ request }) => {
    const listing = await findPublishedListing(request, LISTING_TITLE)

    expect(listing).toBeTruthy()

    const guestToken = await getApiToken(request, GUEST_EMAIL)

    const preview = await request.post(`/api/listings/${listing!.id}/gift-certificates/redeem-preview`, {
      data: { code: E2E_GIFT_CERTIFICATE_CODE },
    })
    expect(preview.ok(), await preview.text()).toBeTruthy()

    const { creditRub } = await preview.json() as { creditRub: number }
    expect(creditRub).toBe(5_000)

    const bookingRes = await request.post('/api/bookings', {
      headers: {
        Authorization: `Bearer ${guestToken}`,
        'Idempotency-Key': crypto.randomUUID(),
      },
      data: {
        listingId: listing!.id,
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        guests: 2,
        giftCertificateCode: E2E_GIFT_CERTIFICATE_CODE,
      },
    })
    expect(bookingRes.ok(), await bookingRes.text()).toBeTruthy()

    const booking = await bookingRes.json() as { giftCertificateCredit: number, totalPrice: number }
    expect(booking.giftCertificateCredit).toBe(5_000)
    expect(booking.totalPrice).toBeGreaterThan(0)
    expect(booking.totalPrice).toBeLessThan(9_900)

    const previewAgain = await request.post(`/api/listings/${listing!.id}/gift-certificates/redeem-preview`, {
      data: { code: E2E_GIFT_CERTIFICATE_CODE },
    })
    expect(previewAgain.status()).toBe(400)
  })

  test('guest can apply certificate on listing page', async ({ page, request }) => {
    const listing = await findPublishedListing(request, LISTING_TITLE)

    expect(listing).toBeTruthy()

    await loginWithOtp(page)

    await gotoReady(page, `/listings/${listing!.id}?checkIn=${CHECK_IN}&checkOut=${CHECK_OUT}&guests=2`)

    await page.getByTestId('booking-gift-certificate-code-input').fill(E2E_GIFT_CERTIFICATE_CODE)
    await page.getByTestId('booking-gift-certificate-apply').click()

    await expect(page.getByText(/сертификат|gift certificate/i).first()).toBeVisible()
    await expect(page.getByText(/−\s*5\s*000|−5\s*000/)).toBeVisible()
  })

  test('host sees certificate sales report', async ({ request }) => {
    const hostToken = await getApiToken(request, HOST_EMAIL)
    const report = await request.get('/api/host/gift-certificates/purchases', {
      headers: { Authorization: `Bearer ${hostToken}` },
    })

    expect(report.ok(), await report.text()).toBeTruthy()

    const body = await report.json() as { summary: { soldCount: number }, purchases: unknown[] }
    expect(body.summary.soldCount).toBeGreaterThanOrEqual(1)
    expect(body.purchases.length).toBeGreaterThanOrEqual(1)
  })
})
