export const HOST_PROMO_BOOKING_REWARD_PERCENT = 1
export const HOST_PROMO_BOOKING_REWARD_MAX = 300

export const calculateHostPromoBookingReward = (totalPrice: number) => {
  const raw = Math.floor(totalPrice * HOST_PROMO_BOOKING_REWARD_PERCENT / 100)
  return Math.min(Math.max(raw, 0), HOST_PROMO_BOOKING_REWARD_MAX)
}

type PromotionSortMeta = {
  promotions?: { boost?: boolean, cityPin?: boolean }
  city?: string
}

export const partitionBoostedFirst = <T extends PromotionSortMeta>(items: T[]) => {
  const boosted: T[] = []
  const rest: T[] = []

  for (const item of items) {
    if (item.promotions?.boost) {
      boosted.push(item)
    } else {
      rest.push(item)
    }
  }

  return [...boosted, ...rest]
}

/** City pin first (when city matches), then boost, then the rest. */
export const partitionPromotedForSearch = <T extends PromotionSortMeta>(
  items: T[],
  city?: string,
) => {
  const normalizedCity = city?.trim().toLowerCase()
  const cityPins: T[] = []
  const boosted: T[] = []
  const rest: T[] = []

  for (const item of items) {
    const isCityPin = Boolean(
      item.promotions?.cityPin
      && normalizedCity
      && item.city?.trim().toLowerCase() === normalizedCity,
    )

    if (isCityPin) {
      cityPins.push(item)
    } else if (item.promotions?.boost) {
      boosted.push(item)
    } else {
      rest.push(item)
    }
  }

  return [...cityPins, ...boosted, ...rest]
}
