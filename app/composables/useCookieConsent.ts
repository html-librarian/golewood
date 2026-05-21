import { COOKIE_CONSENT_STORAGE_KEY, COOKIE_CONSENT_VERSION } from '#shared/constants/cookie-consent'

export const useCookieConsent = () => {
  const consent = useCookie(COOKIE_CONSENT_STORAGE_KEY, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  })

  const isResolved = computed(() => consent.value === COOKIE_CONSENT_VERSION)
  const showBanner = computed(() => !isResolved.value)

  const accept = () => {
    consent.value = COOKIE_CONSENT_VERSION
  }

  return {
    showBanner,
    accept,
  }
}
