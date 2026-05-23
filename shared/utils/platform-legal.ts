import { PLATFORM_LEGAL } from '#shared/constants/platform-legal'

export type PlatformLegalDetails = {
  legalName: string
  inn: string
  kpp: string
  ogrn: string
  legalAddress: string
  email: string
  bankName: string
  bankAccount: string
  bik: string
  workingHours: string
}

export type PlatformLegalConfig = {
  operatorLegalName?: string | number
  operatorInn?: string | number
  operatorKpp?: string | number
  operatorOgrn?: string | number
  operatorLegalAddress?: string
  supportEmail?: string
}

/** NUXT_PUBLIC_* numeric env vars (INN without quotes) arrive as numbers in runtime. */
const trimEnv = (value: string | number | undefined | null): string | undefined => {
  if (value === undefined || value === null) {
    return undefined
  }

  const trimmed = String(value).trim()
  return trimmed || undefined
}

const pickLocale = <T extends { ru: string, en: string }>(value: T, isEn: boolean) =>
  isEn ? value.en : value.ru

export const buildPlatformLegalDetails = (
  locale: string,
  config: PlatformLegalConfig = {},
): PlatformLegalDetails => {
  const isEn = locale === 'en'
  const pick = <T extends { ru: string, en: string }>(value: T) => pickLocale(value, isEn)

  return {
    legalName: trimEnv(config.operatorLegalName) || pick(PLATFORM_LEGAL.legalName),
    inn: trimEnv(config.operatorInn) || PLATFORM_LEGAL.inn,
    kpp: trimEnv(config.operatorKpp) || PLATFORM_LEGAL.kpp,
    ogrn: trimEnv(config.operatorOgrn) || PLATFORM_LEGAL.ogrn,
    legalAddress: trimEnv(config.operatorLegalAddress) || pick(PLATFORM_LEGAL.legalAddress),
    email: trimEnv(config.supportEmail) || PLATFORM_LEGAL.email,
    bankName: pick(PLATFORM_LEGAL.bankName),
    bankAccount: PLATFORM_LEGAL.bankAccount,
    bik: PLATFORM_LEGAL.bik,
    workingHours: pick(PLATFORM_LEGAL.workingHours),
  }
}
