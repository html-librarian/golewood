export const countExtraGuests = (guests: number, includedInPrice: number) =>
  Math.max(0, guests - includedInPrice)

export const getListingGuestCapacity = (listing: {
  maxGuests: number
  extraGuestsOffered?: boolean
  maxGuestsWithExtra?: number | null
}) => {
  if (
    listing.extraGuestsOffered
    && listing.maxGuestsWithExtra
    && listing.maxGuestsWithExtra > listing.maxGuests
  ) {
    return listing.maxGuestsWithExtra
  }

  return listing.maxGuests
}

export const getListingExtraGuestsValidationError = (input: {
  maxGuests: number
  extraGuestsOffered?: boolean
  maxGuestsWithExtra?: number | null
  extraGuestPricePerNight?: number | null
}): string | null => {
  if (!input.extraGuestsOffered) {
    return null
  }

  if (!input.maxGuestsWithExtra || input.maxGuestsWithExtra <= input.maxGuests) {
    return 'Maximum guests with surcharge must be greater than base guest limit'
  }

  if (input.maxGuestsWithExtra > 50) {
    return 'Maximum guests with surcharge cannot exceed 50'
  }

  if (!input.extraGuestPricePerNight || input.extraGuestPricePerNight < 1) {
    return 'Set surcharge per extra guest per night'
  }

  return null
}

export const normalizeListingExtraGuests = (input: {
  extraGuestsOffered?: boolean
  maxGuestsWithExtra?: number | null
  extraGuestPricePerNight?: number | null
}) => {
  if (!input.extraGuestsOffered) {
    return {
      extraGuestsOffered: false,
      maxGuestsWithExtra: null,
      extraGuestPricePerNight: null,
    }
  }

  return {
    extraGuestsOffered: true,
    maxGuestsWithExtra: input.maxGuestsWithExtra ?? null,
    extraGuestPricePerNight: input.extraGuestPricePerNight ?? null,
  }
}
