import { expect, test, type Page } from '@playwright/test'
import { GUEST_EMAIL, HOST_EMAIL, getApiToken, loginWithOtp } from './helpers/auth'
import { resetE2eSeed } from './helpers/seed'

const STUDIO_TITLE = 'Уютная студия у метро'
const TEST_MESSAGE = 'E2E: можно заселиться раньше?'
const HOST_REPLY = 'E2E: да, можно с 14:00'

const sendChatMessage = async (page: Page, text: string) => {
  const input = page.getByTestId('message-input')
  await expect(input).toBeVisible({ timeout: 15_000 })
  await input.fill(text)
  await page.getByTestId('message-send').click()
  await expect(page.getByTestId('message-thread')).toContainText(text, { timeout: 20_000 })
}

test.describe('messaging', () => {
  test.setTimeout(90_000)

  test.beforeEach(() => {
    resetE2eSeed()
  })

  test('guest can open conversation from listing page', async ({ page, request }) => {
    await loginWithOtp(page, GUEST_EMAIL)

    const search = await request.get(`/api/search?city=${encodeURIComponent('Москва')}`)
    const { items } = await search.json() as { items: Array<{ id: string, title: string }> }
    const listing = items.find(item => item.title === STUDIO_TITLE)
    expect(listing).toBeTruthy()

    await page.goto(`/listings/${listing!.id}`)
    await expect(page.getByTestId('message-host')).toBeVisible({ timeout: 15_000 })

    await page.getByTestId('message-host').click()
    await expect(page).toHaveURL(/\/messages\/[0-9a-f-]+/, { timeout: 20_000 })
    await expect(page.getByTestId('message-input')).toBeVisible()
    await expect(page.getByTestId('message-bot').first()).toBeVisible({ timeout: 15_000 })
  })

  test('host sees unread badge and can reply', async ({ page, request }) => {
    const search = await request.get(`/api/search?city=${encodeURIComponent('Москва')}`)
    const { items } = await search.json() as { items: Array<{ id: string, title: string }> }
    const listing = items.find(item => item.title === STUDIO_TITLE)
    expect(listing).toBeTruthy()

    const guestToken = await getApiToken(request, GUEST_EMAIL)
    const startRes = await request.post('/api/conversations', {
      headers: { Authorization: `Bearer ${guestToken}` },
      data: { listingId: listing!.id, body: TEST_MESSAGE },
    })
    expect(startRes.ok(), await startRes.text()).toBeTruthy()
    const conversation = await startRes.json() as { id: string }

    await loginWithOtp(page, HOST_EMAIL)
    await page.goto('/')
    await expect(page.getByTestId('messages-unread-badge').first()).toBeVisible({ timeout: 15_000 })

    await page.goto(`/messages/${conversation.id}`)
    await expect(page.getByTestId('message-thread')).toContainText(TEST_MESSAGE, { timeout: 15_000 })
    await expect(page.getByTestId('message-bot')).toContainText(TEST_MESSAGE, { timeout: 15_000 })
    await sendChatMessage(page, HOST_REPLY)

    await page.context().clearCookies()
    await loginWithOtp(page, GUEST_EMAIL)
    await page.goto(`/messages/${conversation.id}`)
    await expect(page.getByTestId('message-thread')).toContainText(HOST_REPLY, { timeout: 15_000 })
  })
})
