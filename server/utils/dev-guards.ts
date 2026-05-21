import { isDevRuntime, isProductionRuntime } from '#shared/utils/runtime-mode'

/** Hide dev-only HTTP routes on production (404, not 403). */
export const forbidInProduction = () => {
  if (isProductionRuntime()) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
}

export const allowAuthDevCode = (authDevCode: string | undefined) =>
  Boolean(authDevCode?.trim()) && isDevRuntime()

export const allowYookassaMock = (keysMissing: boolean) =>
  keysMissing && isDevRuntime()

export const allowMarketplacePayoutMock = (enabled: boolean) =>
  enabled && isDevRuntime()

export const otpDevExtras = (
  code: string,
  authDevCode: string | undefined,
  extra?: Record<string, string>,
) => (allowAuthDevCode(authDevCode)
  ? { devCode: code, ...extra }
  : {})

export const paymentsNotConfiguredError = () =>
  createError({
    statusCode: 503,
    statusMessage: 'Payments are not configured',
  })
