import { expect, type Page } from '@playwright/test'
import { gotoReady } from './navigation'

/** Seed users — sign in by email OTP (phone/SMS auth is disabled). */
export const GUEST_EMAIL = 'guest@golewood.local'
export const HOST_EMAIL = 'host@golewood.local'
export const ADMIN_EMAIL = 'admin@golewood.local'

/** For admin user lookup by phone in listings moderation. */
export const GUEST_PHONE = '9000000003'
export const GUEST_PHONE_E164 = '+79000000003'
export const HOST_PHONE = '9000000002'
export const HOST_PHONE_E164 = '+79000000002'
export const ADMIN_PHONE = '9000000001'
export const ADMIN_PHONE_E164 = '+79000000001'

export const DEV_OTP_CODE = '0000'

const attemptLoginWithEmail = async (page: Page, email: string) => {
  await gotoReady(page, '/auth/login')
  const emailForm = page.getByTestId('auth-email-form')
  await expect(emailForm).toBeVisible()

  await emailForm.getByLabel(/email/i).fill(email)

  const sendCodeResponse = await Promise.all([
    page.waitForResponse(response => response.url().includes('/api/auth/send-email-code')),
    emailForm.getByRole('button', { name: /получить код|get code/i }).click(),
  ]).then(([response]) => response)

  if (!sendCodeResponse.ok()) {
    throw new Error(`send-email-code failed: ${sendCodeResponse.status()} ${await sendCodeResponse.text()}`)
  }

  const codeInput = emailForm.getByLabel(/код из письма|code from email/i)
  await expect(codeInput).toBeVisible()
  await codeInput.fill(DEV_OTP_CODE)

  const verifyResponse = await Promise.all([
    page.waitForResponse(response => response.url().includes('/api/auth/verify-email'), { timeout: 15_000 }),
    emailForm.getByRole('button', { name: /^(войти|sign in|создать аккаунт|create account)$/i }).click(),
  ]).then(([response]) => response)

  if (!verifyResponse.ok()) {
    const body = await verifyResponse.json().catch(() => null) as { mfaRequired?: boolean } | null
    if (body?.mfaRequired) {
      throw new Error('verify-email returned MFA — use API login or disable 2FA for this user in the test')
    }
    throw new Error(`verify-email failed: ${verifyResponse.status()} ${await verifyResponse.text()}`)
  }

  if (page.url().includes('/auth/complete-profile')) {
    throw new Error('redirected to complete-profile — re-run db:seed so demo users have firstName/lastName')
  }

  await expect(page).toHaveURL(/\/(|account)\/?$/)
  await expect(page.getByRole('link', { name: /bookings|бронирован/i }).first()).toBeVisible()
}

export const loginWithOtp = async (page: Page, email = GUEST_EMAIL) => {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await attemptLoginWithEmail(page, email)
      return
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      await page.context().clearCookies()
      await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)))
    }
  }

  throw lastError!
}

export const getApiToken = async (
  request: import('@playwright/test').APIRequestContext,
  email = GUEST_EMAIL,
) => {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    const headers = { 'x-forwarded-for': `e2e-${crypto.randomUUID()}` }

    await request.post('/api/auth/send-email-code', { data: { email }, headers })

    const verify = await request.post('/api/auth/verify-email', {
      data: { email, code: DEV_OTP_CODE },
      headers,
    })

    if (verify.ok()) {
      const session = await verify.json() as { accessToken: string }
      return session.accessToken
    }

    const body = await verify.json().catch(() => null) as { mfaRequired?: boolean, challengeToken?: string } | null
    if (body?.mfaRequired && body.challengeToken) {
      const mfa = await request.post('/api/auth/verify-mfa', {
        data: { challengeToken: body.challengeToken, code: DEV_OTP_CODE },
        headers,
      })
      if (mfa.ok()) {
        const session = await mfa.json() as { accessToken: string }
        return session.accessToken
      }
    }

    lastError = new Error(`verify-email failed: ${verify.status()} ${await verify.text()}`)
    await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)))
  }

  throw lastError!
}
