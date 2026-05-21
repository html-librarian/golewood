export const DEFAULT_LISTING_CHECK_IN_TIME = '15:00'
export const DEFAULT_LISTING_CHECK_OUT_TIME = '12:00'

/** HH:mm, 00:00–23:59 */
export const LISTING_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export const isListingTime = (value: string) => LISTING_TIME_PATTERN.test(value)

export const formatListingTimeLabel = (time: string) => time
