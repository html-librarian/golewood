/** Treat empty query strings as missing (avoids Zod 400 on `sort=` / `checkIn=`). */
export const emptyToUndefined = (value: unknown) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  return value
}
