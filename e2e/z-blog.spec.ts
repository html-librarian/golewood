import { expect, test } from '@playwright/test'
import { getApiToken, GUEST_EMAIL, HOST_EMAIL, loginWithOtp } from './helpers/auth'
import { acceptCookiesIfVisible } from './helpers/listing'
import { gotoReady } from './helpers/navigation'
import { resetE2eSeed } from './helpers/seed'

const DEMO_POST_TITLE = /выходные в москве|weekend in moscow/i
const GUEST_AUTHOR_QUERY = 'Голевуд'

test.describe('blog', () => {
  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('blog index loads and lists published posts', async ({ page, request }) => {
    const api = await request.get('/api/blog/posts?pageSize=10')
    expect(api.ok()).toBeTruthy()

    const body = await api.json() as { items: Array<{ titleRu: string }>, total: number }
    expect(body.total).toBeGreaterThan(0)
    expect(body.items.some(item => DEMO_POST_TITLE.test(item.titleRu))).toBe(true)

    await gotoReady(page, '/blog')
    await acceptCookiesIfVisible(page)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/блог|blog/i)
    await expect(page.getByTestId('blog-filters')).toBeVisible()
    await expect(page.getByRole('button', { name: /найти|search/i })).toBeVisible()
  })

  test('guest can open my posts from header icon', async ({ page }) => {
    await loginWithOtp(page, GUEST_EMAIL)
    await page.getByTestId('nav-blog-icon').click()
    await expect(page).toHaveURL(/\/blog\/my/)
    await expect(page.getByTestId('blog-my-posts')).toContainText(/выходные в москве/i)
  })

  test('guest can open create post form', async ({ page }) => {
    await loginWithOtp(page, GUEST_EMAIL)
    await gotoReady(page, '/blog/create')
    await acceptCookiesIfVisible(page)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/новая статья|new post/i, { timeout: 15_000 })
    await expect(page.getByTestId('blog-editor-form')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /сохранить|save/i })).toBeVisible()
  })

  test('host can follow author and filter feed by subscriptions', async ({ page, request }) => {
    const authorsResponse = await request.get(`/api/blog/authors?q=${encodeURIComponent(GUEST_AUTHOR_QUERY)}`)
    expect(authorsResponse.ok()).toBeTruthy()

    const authors = await authorsResponse.json() as Array<{ id: string }>
    expect(authors.length).toBeGreaterThan(0)

    const authorId = authors[0]!.id

    await loginWithOtp(page, HOST_EMAIL)
    await gotoReady(page, `/blog/authors/${authorId}`)
    await acceptCookiesIfVisible(page)
    await page.getByTestId('blog-follow-button').click()
    await expect(page.getByTestId('blog-follow-button')).toContainText(/отписаться|unfollow/i)

    await gotoReady(page, '/blog?following=1')
    await acceptCookiesIfVisible(page)
    await expect(page.getByTestId('blog-post-grid')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(DEMO_POST_TITLE)).toBeVisible({ timeout: 15_000 })
  })

  test('blog posts api supports city filter', async ({ request }) => {
    const token = await getApiToken(request, GUEST_EMAIL)
    const response = await request.get(`/api/blog/posts?city=${encodeURIComponent('Москва')}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(response.ok()).toBeTruthy()

    const body = await response.json() as { items: Array<{ city: string | null }>, total: number }
    expect(body.total).toBeGreaterThan(0)
    expect(body.items.some(item => item.city === 'Москва')).toBe(true)
  })

  test('listing page shows traveler stories linked to the place', async ({ page, request }) => {
    const search = await request.get(`/api/search?city=${encodeURIComponent('Москва')}`)
    const { items } = await search.json() as { items: Array<{ id: string, title: string }> }
    const listing = items.find(item => item.title === 'Уютная студия у метро')
    expect(listing).toBeTruthy()

    await gotoReady(page, `/listings/${listing!.id}`)
    await acceptCookiesIfVisible(page)
    await expect(page.getByTestId('listing-blog-posts')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/выходные в москве|weekend in moscow/i)).toBeVisible()
  })

  test('guest can save draft and see it in my posts', async ({ page, request }) => {
    const token = await getApiToken(request, GUEST_EMAIL)
    const title = `E2E Blog Draft ${Date.now()}`

    const create = await request.post('/api/blog/posts', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        titleRu: title,
        excerptRu: 'Краткое описание черновика',
        bodyRu: '<p>Текст черновика для e2e теста блога достаточной длины.</p>',
        status: 'draft',
      },
    })

    expect(create.ok()).toBeTruthy()

    await loginWithOtp(page, GUEST_EMAIL)
    await gotoReady(page, '/blog/my')
    await expect(page.getByTestId('blog-my-posts')).toContainText(title)
    await expect(page.getByTestId('blog-my-posts')).toContainText(/черновик|draft/i)
  })

  test('blog index shows popular authors', async ({ page, request }) => {
    const response = await request.get('/api/blog/authors/popular?limit=3')
    expect(response.ok()).toBeTruthy()

    const authors = await response.json() as Array<{ id: string }>
    expect(authors.length).toBeGreaterThan(0)

    await gotoReady(page, '/blog')
    await acceptCookiesIfVisible(page)
    await expect(page.getByTestId('blog-popular-authors')).toBeVisible({ timeout: 15_000 })
  })
})
