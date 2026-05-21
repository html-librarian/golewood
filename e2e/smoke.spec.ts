import { expect, test } from '@playwright/test'
import { gotoReady } from './helpers/navigation'

test.describe('smoke', () => {
  test.setTimeout(60_000)

  test('home page loads', async ({ page }) => {
    await Promise.all([
      page.waitForResponse(response =>
        response.request().method() === 'GET'
        && response.url().includes('/api/listings')
        && response.ok(),
      ),
      gotoReady(page, '/'),
    ])
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByRole('heading', { name: /популярн|featured/i })).toBeVisible()
    await expect(
      page.getByTestId('featured-carousel').getByRole('link').first(),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('search page loads', async ({ page }) => {
    await gotoReady(page, `/search?city=${encodeURIComponent('Москва')}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/поиск|search/i, { timeout: 15_000 })
    await expect(page.getByRole('link', { name: 'Уютная студия у метро' })).toBeVisible({ timeout: 15_000 })
  })

  test('login page loads', async ({ page }) => {
    await gotoReady(page, '/auth/login')
    const emailForm = page.getByTestId('auth-email-form')
    await expect(emailForm).toBeVisible({ timeout: 15_000 })
    await expect(
      emailForm.getByRole('button', { name: /получить код|get code/i }),
    ).toBeVisible()
  })

  test('health api responds', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.ok()).toBeTruthy()

    const body = await response.json() as { ok: boolean, checks: { postgres: boolean, redis: boolean, meilisearch: boolean } }
    expect(body.ok).toBe(true)
    expect(body.checks.postgres).toBe(true)
    expect(body.checks.redis).toBe(true)
    expect(body.checks.meilisearch).toBe(true)
  })

  test('sitemap is available', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.ok()).toBeTruthy()
    expect(await response.text()).toContain('<urlset')
  })

  test('pwa manifest includes png icons', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest')
    expect(response.ok()).toBeTruthy()

    const manifest = await response.json() as { icons: Array<{ src: string, sizes: string }> }
    expect(manifest.icons.some(icon => icon.src === '/icon-192.png' && icon.sizes === '192x192')).toBe(true)
    expect(manifest.icons.some(icon => icon.src === '/icon-512.png' && icon.sizes === '512x512')).toBe(true)
  })

  test('service worker is available', async ({ request }) => {
    const response = await request.get('/sw.js')
    expect(response.ok()).toBeTruthy()
    expect(await response.text()).toContain('golewood-static-v1')
  })

  test('unknown listing shows not found', async ({ page }) => {
    await gotoReady(page, '/listings/00000000-0000-0000-0000-000000000000')
    await expect(page.getByText(/объявление не найдено|listing not found/i)).toBeVisible({ timeout: 15_000 })
  })

  test('mock yandex oauth login', async ({ page }) => {
    await gotoReady(page, '/auth/login')
    await expect(page.getByTestId('auth-email-form')).toBeVisible()
    await page.getByRole('link', { name: /яндекс|yandex/i }).click()
    await expect(page).toHaveURL('/', { timeout: 15_000 })
    await expect(page.getByRole('link', { name: /bookings|бронирован/i })).toBeVisible()
  })

  test('mock vk oauth login', async ({ page }) => {
    await gotoReady(page, '/auth/login')
    await expect(page.getByTestId('auth-email-form')).toBeVisible()
    await page.getByRole('link', { name: /^vk$/i }).click()
    await expect(page).toHaveURL('/', { timeout: 15_000 })
    await expect(page.getByRole('link', { name: /bookings|бронирован/i })).toBeVisible()
  })
})
