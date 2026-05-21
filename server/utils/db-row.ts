import { createError } from 'h3'

export const requireDbRow = <T>(row: T | undefined, context = 'database row'): T => {
  if (row === undefined) {
    throw createError({ statusCode: 500, statusMessage: `Missing ${context}` })
  }

  return row
}
