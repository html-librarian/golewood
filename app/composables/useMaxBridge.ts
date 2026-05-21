import type { AuthSession } from '#shared/types/user'
import type { MaxBridgeAuthResult, MaxBridgeNeedsLink } from '#shared/types/max-bridge'
import type { MaxThemeParams } from '#shared/types/max-theme'
import { buildMaxBotDeepLink } from '#shared/utils/max-links'
import { maxThemeParamKeys, resolveMaxColorScheme } from '#shared/utils/max-theme'

const MAX_SDK_URL = 'https://st.max.ru/js/max-web-app.js'

let sdkLoadPromise: Promise<void> | null = null

const isNeedsLink = (result: MaxBridgeAuthResult): result is MaxBridgeNeedsLink =>
  'needsLink' in result && result.needsLink === true

const isAuthSession = (result: MaxBridgeAuthResult): result is AuthSession =>
  'accessToken' in result

const runHaptic = (fn: () => Promise<unknown> | undefined) => {
  Promise.resolve(fn()).catch(() => undefined)
}

export const useMaxBridge = () => {
  const config = useRuntimeConfig()
  const colorMode = useColorMode()
  const { user, applySession, isAuthenticated, fetchMe, authHeaders } = useAuth()

  const isMaxContext = useState('max-bridge-context', () => false)
  const platform = useState<string | null>('max-bridge-platform', () => null)
  const themeParams = useState<MaxThemeParams | null>('max-bridge-theme-params', () => null)
  const needsLink = useState<MaxBridgeNeedsLink | null>('max-bridge-needs-link', () => null)
  const bridgePending = useState('max-bridge-pending', () => false)
  const bridgeError = useState('max-bridge-error', () => '')

  const isMaxHost = computed(() => {
    const role = user.value?.role
    return role === 'host' || role === 'admin'
  })

  const applyThemeFromBridge = () => {
    if (!import.meta.client || !window.WebApp) {
      return
    }

    const params = window.WebApp.themeParams ?? null
    themeParams.value = params

    const scheme = resolveMaxColorScheme({
      colorScheme: window.WebApp.colorScheme ?? null,
      themeParams: params,
    })

    if (scheme) {
      colorMode.preference = scheme
    }

    const root = document.documentElement

    if (params) {
      for (const key of maxThemeParamKeys) {
        const value = params[key]

        if (value) {
          root.style.setProperty(`--max-${key.replace(/_/g, '-')}`, value)
        }
      }
    }
  }

  const onThemeChanged = () => {
    applyThemeFromBridge()
  }

  const loadSdk = () => {
    if (import.meta.server) {
      return Promise.resolve()
    }

    if (window.WebApp?.initData) {
      isMaxContext.value = true
      platform.value = window.WebApp.platform ?? null
      applyThemeFromBridge()
      window.WebApp.ready?.()
      return Promise.resolve()
    }

    if (sdkLoadPromise) {
      return sdkLoadPromise
    }

    sdkLoadPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${MAX_SDK_URL}"]`)

      const finish = () => {
        if (window.WebApp) {
          isMaxContext.value = true
          platform.value = window.WebApp.platform ?? null
          applyThemeFromBridge()
          window.WebApp.ready?.()
          window.WebApp.onEvent?.('themeChanged', onThemeChanged)
        }

        resolve()
      }

      if (existing) {
        existing.addEventListener('load', finish, { once: true })
        existing.addEventListener('error', () => reject(new Error('MAX SDK load failed')), { once: true })

        if (window.WebApp) {
          finish()
        }

        return
      }

      const script = document.createElement('script')
      script.src = MAX_SDK_URL
      script.async = true
      script.onload = finish
      script.onerror = () => reject(new Error('MAX SDK load failed'))
      document.head.appendChild(script)
    })

    return sdkLoadPromise
  }

  const getInitData = async () => {
    await loadSdk()
    return window.WebApp?.initData?.trim() ?? ''
  }

  const signInWithBridge = async () => {
    bridgePending.value = true
    bridgeError.value = ''
    needsLink.value = null

    try {
      const initData = await getInitData()

      if (!initData) {
        return { ok: false as const, reason: 'no_init_data' as const }
      }

      const result = await $fetch<MaxBridgeAuthResult>('/api/auth/max/bridge', {
        method: 'POST',
        body: { initData },
        headers: authHeaders.value,
      })

      if (isNeedsLink(result)) {
        needsLink.value = result
        return { ok: false as const, reason: 'needs_link' as const }
      }

      if (isAuthSession(result)) {
        applySession(result)
        return { ok: true as const }
      }

      if ('linked' in result && result.linked) {
        await fetchMe()
        return { ok: true as const, linked: true as const }
      }

      return { ok: false as const, reason: 'unknown' as const }
    } catch {
      bridgeError.value = 'bridge_auth_failed'
      return { ok: false as const, reason: 'error' as const }
    } finally {
      bridgePending.value = false
    }
  }

  const mockSignIn = async (maxUserId = 9_000_000_001) => {
    if (!import.meta.dev) {
      return { ok: false as const, reason: 'dev_only' as const }
    }

    bridgePending.value = true
    bridgeError.value = ''

    try {
      const session = await $fetch<AuthSession>('/api/auth/max/bridge-mock', {
        method: 'POST',
        body: { maxUserId },
      })

      applySession(session)
      return { ok: true as const }
    } catch {
      bridgeError.value = 'bridge_mock_failed'
      return { ok: false as const, reason: 'error' as const }
    } finally {
      bridgePending.value = false
    }
  }

  const ensureSession = async () => {
    if (isAuthenticated.value) {
      await loadSdk().catch(() => undefined)
      return true
    }

    await fetchMe()

    if (isAuthenticated.value) {
      await loadSdk().catch(() => undefined)
      return true
    }

    const initData = import.meta.client ? await getInitData().catch(() => '') : ''

    if (initData) {
      const result = await signInWithBridge()
      return result.ok
    }

    if (import.meta.dev) {
      const result = await mockSignIn()
      return result.ok
    }

    return false
  }

  const openExternal = (url: string) => {
    if (import.meta.client && window.WebApp?.openLink) {
      window.WebApp.openLink(url)
      return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const showBackButton = (onBack: () => void) => {
    if (!import.meta.client || !window.WebApp?.BackButton) {
      return () => undefined
    }

    const { BackButton } = window.WebApp
    BackButton.onClick(onBack)
    BackButton.show()

    return () => {
      BackButton.offClick(onBack)
      BackButton.hide()
    }
  }

  const hapticImpact = (style: 'soft' | 'light' | 'medium' | 'heavy' | 'rigid' = 'light') => {
    if (!import.meta.client || !window.WebApp?.HapticFeedback) {
      return
    }

    runHaptic(() => window.WebApp!.HapticFeedback!.impactOccurred(style))
  }

  const hapticSuccess = () => {
    if (!import.meta.client || !window.WebApp?.HapticFeedback) {
      return
    }

    runHaptic(() => window.WebApp!.HapticFeedback!.notificationOccurred('success'))
  }

  const hapticError = () => {
    if (!import.meta.client || !window.WebApp?.HapticFeedback) {
      return
    }

    runHaptic(() => window.WebApp!.HapticFeedback!.notificationOccurred('error'))
  }

  const hapticSelection = () => {
    if (!import.meta.client || !window.WebApp?.HapticFeedback) {
      return
    }

    runHaptic(() => window.WebApp!.HapticFeedback!.selectionChanged())
  }

  const subscribeVisibilityRefresh = (refresh: () => void | Promise<void>) => {
    if (!import.meta.client) {
      return () => undefined
    }

    const handler = () => {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }

    document.addEventListener('visibilitychange', handler)

    return () => {
      document.removeEventListener('visibilitychange', handler)
    }
  }

  const botDeepLink = computed(() => {
    const username = config.public.maxBotUsername as string

    if (!username) {
      return null
    }

    return buildMaxBotDeepLink(username, 'bookings')
  })

  if (import.meta.client) {
    onUnmounted(() => {
      window.WebApp?.offEvent?.('themeChanged', onThemeChanged)
    })
  }

  return {
    isMaxContext,
    platform,
    themeParams,
    needsLink,
    bridgePending,
    bridgeError,
    botDeepLink,
    isMaxHost,
    loadSdk,
    getInitData,
    signInWithBridge,
    mockSignIn,
    ensureSession,
    openExternal,
    showBackButton,
    applyThemeFromBridge,
    hapticImpact,
    hapticSuccess,
    hapticError,
    hapticSelection,
    subscribeVisibilityRefresh,
  }
}
