export const TRANSFER_AMENITY_SLUG = 'transfer'

export const getListingTransferValidationError = (input: {
  transferOffered?: boolean
  transferPrice?: number | null
  transferPriceOnRequest?: boolean
}): string | null => {
  if (!input.transferOffered || input.transferPriceOnRequest) {
    return null
  }

  if (input.transferPrice === undefined || input.transferPrice === null || input.transferPrice <= 0) {
    return 'Set transfer price or enable price on request'
  }

  return null
}

export const mergeTransferAmenity = (amenities: string[], transferOffered: boolean): string[] => {
  const set = new Set(amenities)

  if (transferOffered) {
    set.add(TRANSFER_AMENITY_SLUG)
  } else {
    set.delete(TRANSFER_AMENITY_SLUG)
  }

  return [...set]
}

export const resolveTransferCharge = (
  transferOffered: boolean,
  transferPriceOnRequest: boolean,
  transferPrice: number | null | undefined,
  includeTransfer: boolean,
): number => {
  if (!transferOffered || !includeTransfer || transferPriceOnRequest) {
    return 0
  }

  return transferPrice ?? 0
}
