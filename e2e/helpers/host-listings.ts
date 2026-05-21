import { expect, type APIRequestContext, type Page } from '@playwright/test'
import { getApiToken, HOST_EMAIL } from './auth'

export const DRAFT_LISTING_TITLE = 'Черновик на Арбате'

export const archiveHostListingByTitle = async (
  page: Page,
  request: APIRequestContext,
  title = DRAFT_LISTING_TITLE,
  hostEmail = HOST_EMAIL,
) => {
  const token = await getApiToken(request, hostEmail)
  const listingsRes = await request.get('/api/host/listings', {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(listingsRes.ok()).toBeTruthy()

  const listings = await listingsRes.json() as Array<{ id: string, title: string }>
  const listing = listings.find(item => item.title === title)
  expect(listing).toBeTruthy()

  const archiveRes = await request.delete(`/api/host/listings/${listing!.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(archiveRes.ok(), await archiveRes.text()).toBeTruthy()

  await page.reload()
  await page.getByRole('button', { name: /^в архиве$|^archived$/i }).click()
  await expect(page.getByRole('link', { name: title })).toBeVisible({ timeout: 15_000 })

  return listing!.id
}
