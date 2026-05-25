import { describe, expect, it } from 'vitest'
import { formatPostgresErrorMessage, postgresErrorHint } from './postgres-error'

describe('postgres-error', () => {
  it('detects missing column and suggests migrate', () => {
    const err = {
      message: 'Failed query',
      cause: { message: 'column "meta_title" does not exist', code: '42703' },
    }

    expect(formatPostgresErrorMessage(err)).toBe('column "meta_title" does not exist')
    expect(postgresErrorHint(err)).toContain('db:migrate')
  })
})
