import { expect, test } from '@playwright/test'
import Redis from 'ioredis'
import { DEV_OTP_CODE, HOST_EMAIL, getApiToken } from './helpers/auth'
import { resetE2eSeed } from './helpers/seed'

const clearAuthRedisKeys = async () => {
  const redis = new Redis(process.env.NUXT_REDIS_URL ?? 'redis://localhost:6379')

  try {
    const keys = await redis.keys('otp:*')
    const mfaKeys = await redis.keys('mfa:challenge:*')
    const all = [...keys, ...mfaKeys]

    if (all.length) {
      await redis.del(...all)
    }
  } finally {
    await redis.quit()
  }
}

test.describe('two-factor authentication', () => {
  test.beforeEach(async () => {
    resetE2eSeed()
    await clearAuthRedisKeys()
  })

  test('enabling 2FA requires email code on email login', async ({ request }) => {
    const hostToken = await getApiToken(request, HOST_EMAIL)

    const sendEnable = await request.post('/api/account/two-factor/send-enable-code', {
      headers: { Authorization: `Bearer ${hostToken}` },
    })
    expect(sendEnable.ok(), await sendEnable.text()).toBeTruthy()

    const confirmEnable = await request.post('/api/account/two-factor/confirm-enable', {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { code: DEV_OTP_CODE },
    })
    expect(confirmEnable.ok(), await confirmEnable.text()).toBeTruthy()

    const status = await confirmEnable.json() as { enabled: boolean }
    expect(status.enabled).toBe(true)

    const headers = { 'x-forwarded-for': `e2e-2fa-${crypto.randomUUID()}` }

    await request.post('/api/auth/send-email-code', {
      data: { email: HOST_EMAIL },
      headers,
    })

    const verify = await request.post('/api/auth/verify-email', {
      data: { email: HOST_EMAIL, code: DEV_OTP_CODE },
      headers,
    })
    expect(verify.ok()).toBeTruthy()

    const challenge = await verify.json() as {
      mfaRequired: boolean
      challengeToken: string
      maskedEmail: string
      devCode?: string
    }
    expect(challenge.mfaRequired).toBe(true)
    expect(challenge.challengeToken).toBeTruthy()
    expect(challenge.maskedEmail).toContain('@')

    const mfaCode = challenge.devCode ?? DEV_OTP_CODE

    const mfa = await request.post('/api/auth/verify-mfa', {
      data: { challengeToken: challenge.challengeToken, code: mfaCode },
    })
    expect(mfa.ok(), await mfa.text()).toBeTruthy()

    const session = await mfa.json() as { accessToken: string, user: { twoFactorEnabled: boolean } }
    expect(session.accessToken).toBeTruthy()
    expect(session.user.twoFactorEnabled).toBe(true)

    const disableToken = session.accessToken
    await request.post('/api/account/two-factor/send-disable-code', {
      headers: { Authorization: `Bearer ${disableToken}` },
    })
    const disable = await request.post('/api/account/two-factor/confirm-disable', {
      headers: { Authorization: `Bearer ${disableToken}` },
      data: { code: DEV_OTP_CODE },
    })
    expect(disable.ok(), await disable.text()).toBeTruthy()
    expect((await disable.json() as { enabled: boolean }).enabled).toBe(false)
  })

  test('mock yandex oauth requires 2FA when enabled on linked host', async ({ page, request }) => {
    const hostToken = await getApiToken(request, HOST_EMAIL)

    await request.post('/api/account/two-factor/send-enable-code', {
      headers: { Authorization: `Bearer ${hostToken}` },
    })
    const confirmEnable = await request.post('/api/account/two-factor/confirm-enable', {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { code: DEV_OTP_CODE },
    })
    expect(confirmEnable.ok(), await confirmEnable.text()).toBeTruthy()

    await page.goto('/auth/login')
    await page.getByRole('link', { name: /яндекс|yandex/i }).click()

    await expect(page).toHaveURL(/\/auth\/login\?.*mfa=1/, { timeout: 15_000 })
    await expect(page.getByTestId('auth-mfa-form')).toBeVisible()

    const devHint = page.locator('strong').filter({ hasText: /^\d{4}$/ })
    const mfaCode = (await devHint.count()) > 0
      ? (await devHint.first().textContent()) ?? DEV_OTP_CODE
      : DEV_OTP_CODE

    await page.getByLabel(/код из письма|code from email/i).fill(mfaCode)
    await page.getByRole('button', { name: /войти|sign in/i }).first().click()

    await expect(page).toHaveURL(/\/account/, { timeout: 15_000 })

    await request.post('/api/account/two-factor/send-disable-code', {
      headers: { Authorization: `Bearer ${hostToken}` },
    })
    await request.post('/api/account/two-factor/confirm-disable', {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { code: DEV_OTP_CODE },
    })
  })
})
