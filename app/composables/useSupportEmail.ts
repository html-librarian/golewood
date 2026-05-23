import { PLATFORM_SUPPORT_EMAIL } from '#shared/constants/platform-legal'

const resolveSupportEmail = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined
  }

  const trimmed = String(value).trim()
  return trimmed || undefined
}

export const useSupportEmail = () => {
  const config = useRuntimeConfig()

  const supportEmail = computed(() =>
    resolveSupportEmail(config.public.supportEmail)
    ?? resolveSupportEmail(config.supportEmail)
    ?? PLATFORM_SUPPORT_EMAIL,
  )

  return { supportEmail }
}
