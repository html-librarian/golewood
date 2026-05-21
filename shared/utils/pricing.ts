import { PLATFORM_FEE_PERCENT } from '../constants/platform-fee.ts'
import { countExtraGuests } from './listing-extra-guests.ts'

export const DEFAULT_SERVICE_FEE_PERCENT = PLATFORM_FEE_PERCENT

export interface BookingPriceBreakdown {
  nights: number
  pricePerNight: number
  subtotal: number
  extraGuests: number
  extraGuestPricePerNight: number
  extraGuestTotal: number
  cleaningFee: number
  serviceFee: number
  transferPrice: number
  transferOnRequest: boolean
  total: number
}

export const calculateBookingPrice = (
  nights: number,
  pricePerNight: number,
  options: {
    cleaningFee?: number
    serviceFeePercent?: number
    transferPrice?: number
    transferOnRequest?: boolean
    guests?: number
    maxGuestsIncluded?: number
    extraGuestPricePerNight?: number
  } = {},
): BookingPriceBreakdown => {
  const cleaningFee = options.cleaningFee ?? 0
  const serviceFeePercent = options.serviceFeePercent ?? DEFAULT_SERVICE_FEE_PERCENT
  const transferPrice = options.transferPrice ?? 0
  const transferOnRequest = options.transferOnRequest ?? false
  const maxGuestsIncluded = options.maxGuestsIncluded ?? 0
  const extraGuestPricePerNight = options.extraGuestPricePerNight ?? 0
  const extraGuests = options.guests && maxGuestsIncluded > 0
    ? countExtraGuests(options.guests, maxGuestsIncluded)
    : 0
  const extraGuestTotal = extraGuests * extraGuestPricePerNight * nights

  const subtotal = nights * pricePerNight
  const accommodationBase = subtotal + extraGuestTotal
  const serviceFee = Math.round(accommodationBase * serviceFeePercent / 100)
  const total = accommodationBase + cleaningFee + serviceFee + transferPrice

  return {
    nights,
    pricePerNight,
    subtotal,
    extraGuests,
    extraGuestPricePerNight,
    extraGuestTotal,
    cleaningFee,
    serviceFee,
    transferPrice,
    transferOnRequest,
    total,
  }
}

/** Сумма хозяину и платформе при оплате гостем (до бонусов). */
export const splitBookingSettlement = (pricing: BookingPriceBreakdown) => ({
  hostAmount: pricing.total - pricing.serviceFee,
  platformFee: pricing.serviceFee,
})
