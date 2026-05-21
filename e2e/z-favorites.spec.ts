import { expect, test } from '@playwright/test'
import { loginWithOtp } from './helpers/auth'
import { resetE2eSeed } from './helpers/seed'

const STUDIO_TITLE = 'Уютная студия у метро'

test.describe('favorites', () => {
  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('guest can add listing to favorites', async ({ page, request }) => {
    await loginWithOtp(page)

    const search = await request.get(`/api/search?city=${encodeURIComponent('Москва')}`)
    const { items } = await search.json() as { items: Array<{ id: string, title: string }> }
    const listing = items.find(item => item.title === STUDIO_TITLE)
    expect(listing).toBeTruthy()

    await page.goto(`/listings/${listing!.id}`)
    await page.getByRole('button', { name: /избран|favorite/i }).click()
    await expect(page.getByRole('button', { name: /убрать|remove from favorites/i })).toBeVisible()

    await page.goto('/favorites')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/избран|favorites/i)
    await expect(page.getByRole('link', { name: STUDIO_TITLE })).toBeVisible()
  })

  test('guest can remove listing from favorites page', async ({ page, request }) => {
    await loginWithOtp(page)

    const search = await request.get(`/api/search?city=${encodeURIComponent('Москва')}`)
    const { items } = await search.json() as { items: Array<{ id: string, title: string }> }
    const listing = items.find(item => item.title === STUDIO_TITLE)
    expect(listing).toBeTruthy()

    await request.post(`/api/favorites/${listing!.id}`, {
      headers: { Authorization: `Bearer ${(await page.context().cookies()).find(c => c.name === 'auth-access-token')!.value}` },
    })

    await page.goto('/favorites')
    const card = page.locator('.space-y-2').filter({ has: page.getByRole('link', { name: STUDIO_TITLE }) })
    await expect(card).toBeVisible()
    await card.getByRole('button', { name: /убрать|remove from favorites/i }).click()
    await expect(page.getByText(/нет избран|no favorite/i)).toBeVisible()
  })
})
