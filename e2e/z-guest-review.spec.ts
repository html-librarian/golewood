import { expect, test } from '@playwright/test'
import { GUEST_EMAIL, getApiToken, loginWithOtp } from './helpers/auth'
import { resetE2eSeed } from './helpers/seed'

const NEW_REVIEW_TEXT = 'Прекрасное место, всё понравилось. Обязательно вернусь снова!'

test.describe('guest review', () => {
  test.setTimeout(60_000)

  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('guest can leave review after completed stay', async ({ page, request }) => {
    const token = await getApiToken(request, GUEST_EMAIL)
    const bookingsResponse = await request.get('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(bookingsResponse.ok()).toBeTruthy()

    const bookings = await bookingsResponse.json() as {
      id: string
      canReview?: boolean
      listing: { id: string, title: string }
    }[]
    const reviewable = bookings.find(booking => booking.canReview)

    expect(reviewable).toBeTruthy()
    const listingTitle = reviewable!.listing.title

    await loginWithOtp(page, GUEST_EMAIL)

    await Promise.all([
      page.waitForResponse(response =>
        response.url().includes('review-eligibility') && response.ok(),
      ),
      page.goto(`/listings/${reviewable!.listing.id}?leaveReview=${reviewable!.id}`),
    ])

    await expect(page.getByRole('heading', { level: 1 })).toContainText(listingTitle)

    const reviewForm = page.getByTestId('review-form')
    await expect(reviewForm).toBeVisible()

    for (const dimension of ['cleanliness', 'checkIn', 'location', 'photoMatch', 'value', 'service']) {
      await reviewForm.getByTestId(`review-rating-${dimension}-9`).click()
    }

    await reviewForm.locator('textarea').fill(NEW_REVIEW_TEXT)

    const submitButton = reviewForm.getByRole('button', { name: /отправить отзыв|submit review/i })
    await expect(submitButton).toBeEnabled()
    await submitButton.click()

    await expect(page.getByTestId('review-success')).toBeVisible({ timeout: 15_000 })
  })
})
