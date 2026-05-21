import { expect, test } from '@playwright/test'
import { loginWithOtp } from './helpers/auth'
import { findPublishedListing } from './helpers/listing'
import { gotoReady } from './helpers/navigation'
import { resetE2eSeed } from './helpers/seed'

const PROPERTY_TITLE = 'Глэмпинг «Боровое»'
const CHECK_IN = '2026-08-01'
const CHECK_OUT = '2026-08-04'

test.describe('property complex', () => {
  test.setTimeout(90_000)

  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('property page lists units and passes dates to unit booking', async ({ page, request }) => {
    const property = await findPublishedListing(request, PROPERTY_TITLE)

    expect(property).toBeTruthy()

    await loginWithOtp(page)
    await gotoReady(page, `/listings/${property!.id}`)

    await expect(page.getByTestId('listing-property-units')).toBeVisible()

    await page.getByLabel(/заезд|check-in/i).fill(CHECK_IN)
    await page.getByLabel(/выезд|check-out/i).fill(CHECK_OUT)

    const bookLink = page.locator('a').filter({
      has: page.getByRole('button', { name: /забронировать|book/i }),
    }).first()
    const href = await bookLink.getAttribute('href')

    expect(href).toContain('checkIn=')
    expect(href).toContain('checkOut=')

    await bookLink.click()

    await expect(page).toHaveURL(new RegExp(`checkIn=${CHECK_IN}`))
    await expect(page).toHaveURL(new RegExp(`checkOut=${CHECK_OUT}`))
  })
})
