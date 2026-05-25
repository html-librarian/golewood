import { describe, expect, it } from 'vitest'
import { isMissingRelationError } from './db-errors'

describe('isMissingRelationError', () => {
  it('detects missing column from Drizzle wrapped error', () => {
    const err = {
      message: 'Failed query: select "meta_title" from listings',
      cause: { message: 'column "meta_title" does not exist', code: '42703' },
    }

    expect(isMissingRelationError(err)).toBe(true)
  })
})
