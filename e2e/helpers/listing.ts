import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, type APIRequestContext, type Page } from '@playwright/test'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const E2E_LISTING_TITLE = 'E2E Listing Moscow'

export const PHOTO_FIXTURE = path.join(dirname, '../fixtures/listing-photo.svg')

export const acceptCookiesIfVisible = async (page: Page) => {
  const accept = page.getByRole('button', { name: /принять|accept/i })

  if (await accept.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await accept.click()
  }
}

export const findPublishedListing = async (
  request: APIRequestContext,
  title: string,
  city = 'Москва',
) => {
  const response = await request.get(`/api/listings?city=${encodeURIComponent(city)}`)
  const listings = await response.json() as Array<{ id: string, title: string }>

  return listings.find(item => item.title === title)
}

export const selectCityInWizard = async (page: Page, cityName: string) => {
  const field = page.getByTestId('form-city-select')

  await field.getByRole('button', { name: /открыть список|open city list/i }).click()
  await page.getByPlaceholder(/поиск города|search city/i).fill(cityName)
  await page.getByRole('listbox').getByRole('button', { name: cityName, exact: true }).click()
}

export const fillListingWizard = async (page: Page, title = E2E_LISTING_TITLE) => {
  await acceptCookiesIfVisible(page)

  await page.getByLabel(/назван|title/i).fill(title)
  await selectCityInWizard(page, 'Москва')
  await page.getByLabel(/адрес|address/i).fill('ул. E2E, 1')
  await page.getByRole('button', { name: /далее|next/i }).click()

  await page.getByLabel(/цена за ночь|price per night/i).fill('5000')
  await page.getByLabel(/гостей в цене|guests/i).fill('2')
  await page.getByLabel(/спален|bedrooms/i).fill('1')

  const wifiChip = page.getByRole('button', { name: /wifi/i })
  if (await wifiChip.isVisible().catch(() => false)) {
    await wifiChip.click()
  }

  await page.getByRole('button', { name: /далее|next/i }).click()

  await page.locator('input[type="file"][multiple]').setInputFiles(PHOTO_FIXTURE)
  await expect(page.locator('img[src*="/uploads/listings/"]')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: /далее|next/i }).click()

  await Promise.all([
    page.waitForURL(/\/host\/listings\/?$/),
    page.getByRole('button', { name: /отправить на модерацию|submit for review/i }).click(),
  ])
}
