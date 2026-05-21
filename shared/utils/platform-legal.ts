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
  operatorLegalName?: string
  operatorInn?: string
  operatorKpp?: string
  operatorOgrn?: string
  operatorLegalAddress?: string
  supportEmail?: string
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
    legalName: config.operatorLegalName?.trim() || pick(PLATFORM_LEGAL.legalName),
    inn: config.operatorInn?.trim() || PLATFORM_LEGAL.inn,
    kpp: config.operatorKpp?.trim() || PLATFORM_LEGAL.kpp,
    ogrn: config.operatorOgrn?.trim() || PLATFORM_LEGAL.ogrn,
    legalAddress: config.operatorLegalAddress?.trim() || pick(PLATFORM_LEGAL.legalAddress),
    email: config.supportEmail?.trim() || PLATFORM_LEGAL.email,
    bankName: pick(PLATFORM_LEGAL.bankName),
    bankAccount: PLATFORM_LEGAL.bankAccount,
    bik: PLATFORM_LEGAL.bik,
    workingHours: pick(PLATFORM_LEGAL.workingHours),
  }
}
