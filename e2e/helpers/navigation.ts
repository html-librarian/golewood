import type { Page } from '@playwright/test'

export const gotoReady = async (page: Page, path: string) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30_000 })
      return
    } catch (error) {
      if (attempt === 2) {
        throw error
      }

      await page.waitForTimeout(500)
    }
  }
}
