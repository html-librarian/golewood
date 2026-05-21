import { buildPlatformLegalDetails } from '#shared/utils/platform-legal'

export const usePlatformLegal = () => {
  const config = useRuntimeConfig()
  const { locale } = useI18n()

  const platformLegal = computed(() => buildPlatformLegalDetails(locale.value, {
    operatorLegalName: config.public.operatorLegalName as string,
    operatorInn: config.public.operatorInn as string,
    operatorKpp: config.public.operatorKpp as string,
    operatorOgrn: config.public.operatorOgrn as string,
    operatorLegalAddress: config.public.operatorLegalAddress as string,
    supportEmail: (config.public.supportEmail as string) || (config.supportEmail as string),
  }))

  return { platformLegal }
}
