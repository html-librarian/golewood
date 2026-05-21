import type { MaxThemeParams } from '#shared/types/max-theme'

export {}

interface MaxWebAppInitUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string | null
  language_code?: string
  photo_url?: string | null
}

interface MaxWebAppInitDataUnsafe {
  query_id?: string
  auth_date?: number
  hash?: string
  user?: MaxWebAppInitUser
  start_param?: string
}

interface MaxWebAppBackButton {
  isVisible: boolean
  show: () => void
  hide: () => void
  onClick: (callback: () => void) => void
  offClick: (callback: () => void) => void
}

type MaxHapticImpactStyle = 'soft' | 'light' | 'medium' | 'heavy' | 'rigid'
type MaxHapticNotificationType = 'error' | 'success' | 'warning'

interface MaxWebAppHapticFeedback {
  impactOccurred: (
    impactStyle: MaxHapticImpactStyle,
    disableVibrationFallback?: boolean,
  ) => Promise<{ status: string }>
  notificationOccurred: (
    notificationType: MaxHapticNotificationType,
    disableVibrationFallback?: boolean,
  ) => Promise<{ status: string }>
  selectionChanged: (disableVibrationFallback?: boolean) => Promise<{ status: string }>
}

interface MaxWebApp {
  initData: string
  initDataUnsafe: MaxWebAppInitDataUnsafe
  platform: 'ios' | 'android' | 'desktop' | 'web' | string
  version: string
  colorScheme?: 'light' | 'dark' | string
  themeParams?: MaxThemeParams
  BackButton: MaxWebAppBackButton
  HapticFeedback?: MaxWebAppHapticFeedback
  openLink: (url: string) => void
  openMaxLink: (url: string) => void
  ready?: () => void
  onEvent?: (event: string, callback: () => void) => void
  offEvent?: (event: string, callback: () => void) => void
}

declare global {
  interface Window {
    WebApp?: MaxWebApp
  }
}
