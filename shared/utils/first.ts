/** First element of a non-empty list (for noUncheckedIndexedAccess-safe access). */
export const first = <T>(items: readonly T[], message = 'Expected a non-empty collection'): T => {
  const value = items[0]

  if (value === undefined) {
    throw new Error(message)
  }

  return value
}
