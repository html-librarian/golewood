export const formatPrice = (value: number, locale = 'ru-RU') =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
