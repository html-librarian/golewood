import { expect, test } from '@playwright/test'
import { ADMIN_EMAIL, HOST_EMAIL, loginWithOtp } from './helpers/auth'
import { archiveHostListingByTitle, DRAFT_LISTING_TITLE } from './helpers/host-listings'
import { resetE2eSeed } from './helpers/seed'

const MODERATION_LISTING = 'Лофт на модерации'
const PENDING_REVIEW_TEXT = 'Хорошая квартира, но ночью шумно'

test.describe('admin flow', () => {
  test.setTimeout(60_000)

  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('admin can publish listing and resolve report', async ({ page, request }) => {
    await loginWithOtp(page, ADMIN_EMAIL)

    await page.goto('/admin')
    await expect(page.getByRole('navigation').getByRole('link', { name: /объявлен|listings/i })).toBeVisible()
    await expect(page.getByText(/пользовател|users/i).first()).toBeVisible()

    const token = (await page.context().cookies()).find(cookie => cookie.name === 'auth-access-token')?.value
    const stats = await request.get('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(stats.ok()).toBeTruthy()
    const body = await stats.json() as { queue: { users: number, listingsModeration: number, listingsArchived: number, reportsOpen: number } }
    expect(body.queue.users).toBeGreaterThanOrEqual(3)
    expect(body.queue.listingsModeration).toBeGreaterThanOrEqual(1)
    expect(body.queue.listingsArchived).toBeGreaterThanOrEqual(0)
    expect(body.queue.reportsOpen).toBeGreaterThanOrEqual(1)

    await page.goto('/admin/listings')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/модерац|moderation/i)

    const listingCard = page.locator('article').filter({ hasText: MODERATION_LISTING })
    await expect(listingCard).toBeVisible()
    await listingCard.getByRole('button', { name: /опубликовать|publish/i }).click()
    await page.reload()
    await expect(page.locator('article').filter({ hasText: MODERATION_LISTING })).toHaveCount(0, { timeout: 15_000 })

    const reviewCard = page.locator('article').filter({ hasText: PENDING_REVIEW_TEXT })
    await expect(reviewCard).toBeVisible()
    await reviewCard.getByRole('button', { name: /одобрить|approve/i }).first().click()
    await expect(reviewCard).toBeHidden()

    const search = await request.get(`/api/search?city=${encodeURIComponent('Казань')}`)
    const { items } = await search.json() as { items: Array<{ title: string }> }
    expect(items.some(item => item.title === MODERATION_LISTING)).toBeTruthy()

    await page.goto('/admin/reports')
    await expect(page.getByText(/подозрительные фото/i)).toBeVisible()
    await page.getByRole('button', { name: /решить|resolve/i }).click()
    await expect(page.getByText(/нет открытых жалоб|no open reports/i)).toBeVisible()
  })

  test('admin sees demo users', async ({ page }) => {
    await loginWithOtp(page, ADMIN_EMAIL)

    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/пользовател|users/i)
    await expect(page.getByText('+79000000001')).toBeVisible()
    await expect(page.getByText('+79000000002')).toBeVisible()
    await expect(page.getByText('+79000000003')).toBeVisible()
  })

  test('admin can change user role', async ({ page }) => {
    await loginWithOtp(page, ADMIN_EMAIL)

    await page.goto('/admin/users')

    const guestCard = page.locator('article').filter({ hasText: '+79000000003' })
    await expect(guestCard).toBeVisible()
    await expect(guestCard.locator('select')).toHaveValue('guest')

    await guestCard.locator('select').selectOption('host')
    await guestCard.getByRole('button', { name: /сохранить|save/i }).click()

    await expect(guestCard.locator('select')).toHaveValue('host')
  })

  test('admin can reindex search', async ({ page }) => {
    await loginWithOtp(page, ADMIN_EMAIL)

    await page.goto('/admin/listings')

    const reindexResponse = await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/admin/search/reindex')),
      page.getByRole('button', { name: /переиндекс|reindex/i }).click(),
    ]).then(([response]) => response)

    expect(reindexResponse.ok()).toBeTruthy()

    const body = await reindexResponse.json() as { indexed: number }
    expect(body.indexed).toBeGreaterThanOrEqual(2)
  })

  test('admin can restore archived listing', async ({ page, request }) => {
    await loginWithOtp(page, HOST_EMAIL)
    await page.goto('/host/listings')
    await archiveHostListingByTitle(page, request, DRAFT_LISTING_TITLE)

    await page.context().clearCookies()
    await loginWithOtp(page, ADMIN_EMAIL)

    await page.goto('/admin/listings')
    const archivedCard = page.locator('article').filter({ hasText: DRAFT_LISTING_TITLE })
    await expect(archivedCard).toBeVisible({ timeout: 15_000 })
    await archivedCard.getByRole('button', { name: /восстанов|restore/i }).click()
    await expect(archivedCard).toBeHidden({ timeout: 15_000 })
  })
})
