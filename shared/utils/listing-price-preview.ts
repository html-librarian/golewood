import { PLATFORM_FEE_PERCENT } from '../constants/platform-fee.ts'

export type ListingPriceInputMode = 'hostNet' | 'guestTotal'

export const calcNightlyServiceFee = (pricePerNight: number) =>
  Math.round(pricePerNight * PLATFORM_FEE_PERCENT / 100)

export const calcGuestNightlyTotal = (pricePerNight: number) =>
  pricePerNight + calcNightlyServiceFee(pricePerNight)

/** Base price stored in DB from the total amount the guest pays per night (incl. service fee). */
export const calcPricePerNightFromGuestTotal = (guestTotal: number): number => {
  if (guestTotal <= 0) {
    return 0
  }

  let base = Math.floor(guestTotal / (1 + PLATFORM_FEE_PERCENT / 100))

  while (base > 0 && calcGuestNightlyTotal(base) > guestTotal) {
    base -= 1
  }

  while (calcGuestNightlyTotal(base) < guestTotal) {
    base += 1
  }

  if (calcGuestNightlyTotal(base) > guestTotal && base > 0) {
    base -= 1
  }

  return base
}

export const resolveListingPricePerNight = (
  mode: ListingPriceInputMode,
  inputRub: number,
): number => {
  if (inputRub <= 0) {
    return 0
  }

  return mode === 'hostNet' ? inputRub : calcPricePerNightFromGuestTotal(inputRub)
}

export const formatListingPriceBreakdown = (pricePerNight: number) => ({
  pricePerNight,
  serviceFee: calcNightlyServiceFee(pricePerNight),
  guestTotal: calcGuestNightlyTotal(pricePerNight),
})

export const listingPriceInputFromStored = (
  mode: ListingPriceInputMode,
  pricePerNight: number,
): number => {
  if (pricePerNight <= 0) {
    return 0
  }

  return mode === 'hostNet' ? pricePerNight : calcGuestNightlyTotal(pricePerNight)
}
