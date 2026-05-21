import { expect, test } from '@playwright/test'
import { ADMIN_EMAIL, getApiToken, loginWithOtp } from './helpers/auth'
import { gotoReady } from './helpers/navigation'

test.describe('content & trust (v38–v40)', () => {
  test.setTimeout(60_000)

  test('public APIs: spotlight hero, photos, team badges, listing stories', async ({ request }) => {
    const hero = await request.get('/api/spotlight/hero')
    expect(hero.ok()).toBeTruthy()
    const heroBody = await hero.json() as { imageUrl: string | null }
    expect(heroBody).toHaveProperty('imageUrl')

    const photos = await request.get('/api/spotlight/photos')
    expect(photos.ok()).toBeTruthy()
    expect(Array.isArray(await photos.json())).toBe(true)

    const badges = await request.get('/api/team-badges')
    expect(badges.ok()).toBeTruthy()
    const badgeList = await badges.json() as Array<{ slug: string }>
    expect(badgeList.some(badge => badge.slug === 'team_visited')).toBe(true)

    const search = await request.get(`/api/search?city=${encodeURIComponent('Москва')}`)
    expect(search.ok()).toBeTruthy()
    const { items } = await search.json() as { items: Array<{ id: string }> }
    expect(items.length).toBeGreaterThan(0)

    const stories = await request.get(`/api/listings/${items[0]!.id}/stories`)
    expect(stories.ok()).toBeTruthy()
    expect(Array.isArray(await stories.json())).toBe(true)
  })

  test('spotlight page loads', async ({ page }) => {
    await gotoReady(page, '/spotlight')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/фото месяца|photo of the month/i, { timeout: 15_000 })
  })

  test('home hero links to spotlight', async ({ page }) => {
    await gotoReady(page, '/')
    await expect(page.getByRole('link', { name: /фото месяца →|photo of the month →/i })).toBeVisible({ timeout: 15_000 })
  })

  test('admin spotlight page loads', async ({ page }) => {
    await loginWithOtp(page, ADMIN_EMAIL)
    await gotoReady(page, '/admin/spotlight')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/фото месяца|photo of the month/i, { timeout: 15_000 })
  })

  test('admin team badges APIs', async ({ request }) => {
    const adminToken = await getApiToken(request, ADMIN_EMAIL)
    const headers = { Authorization: `Bearer ${adminToken}` }

    const badgesRes = await request.get('/api/admin/team-badges', { headers })
    expect(badgesRes.ok(), await badgesRes.text()).toBeTruthy()

    const publishedRes = await request.get('/api/admin/listings/published', { headers })
    expect(publishedRes.ok(), await publishedRes.text()).toBeTruthy()
  })

  test('admin team badges page loads', async ({ page }) => {
    await loginWithOtp(page, ADMIN_EMAIL)

    await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/admin/team-badges') && response.ok()),
      page.waitForResponse(response => response.url().includes('/api/admin/listings/published') && response.ok()),
      gotoReady(page, '/admin/team-badges'),
    ])

    await expect(page.locator('h1')).toContainText(/метки команды|team badges/i, { timeout: 20_000 })
    await expect(page.getByRole('button', { name: /добавить метку|add badge/i })).toBeVisible()
  })

  test('guest stories page loads', async ({ page }) => {
    await loginWithOtp(page)

    await gotoReady(page, '/stories')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/мои сторис|my stories/i, { timeout: 15_000 })
  })
})
