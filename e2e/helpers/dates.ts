import { formatDisplayDate } from '../../shared/utils/calendar'

export const formatBookingDateRange = (checkIn: string, checkOut: string, locale: 'ru' | 'en' = 'ru') =>
  `${formatDisplayDate(checkIn, locale)} → ${formatDisplayDate(checkOut, locale)}`

export const formatBookingCheckIn = (checkIn: string, locale: 'ru' | 'en' = 'ru') =>
  formatDisplayDate(checkIn, locale)
