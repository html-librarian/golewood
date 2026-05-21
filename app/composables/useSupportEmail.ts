const DEFAULT_SUPPORT_EMAIL = 'support@golewood.ru'

export const useSupportEmail = () => {
  const config = useRuntimeConfig()

  const supportEmail = computed(() => {
    const fromPublic = (config.public.supportEmail as string)?.trim()
    const fromServer = (config.supportEmail as string)?.trim()
    return fromPublic || fromServer || DEFAULT_SUPPORT_EMAIL
  })

  return { supportEmail }
}
