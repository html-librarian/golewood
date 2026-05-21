export const getCurrentMonthKey = (date: Date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export const formatMonthLabel = (monthKey: string, locale: string) => {
  const [year = 0, month = 1] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString(locale === 'en' ? 'en-GB' : 'ru-RU', {
    month: 'long',
    year: 'numeric',
  })
}
