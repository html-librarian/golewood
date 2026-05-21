/** Срок действия купленного сертификата (дней). */
export const GIFT_CERTIFICATE_VALIDITY_DAYS = 365

export const GIFT_CERTIFICATE_METADATA_KIND = 'gift_certificate_purchase'

/** Доступные номиналы для включения хозяином (₽). */
export const GIFT_CERTIFICATE_NOMINALS_RUB = [3000, 5000, 7000, 10_000, 15_000, 20_000] as const
