import { describe, expect, it } from 'vitest'
import { slugFromTitle } from './slug'

describe('slugFromTitle', () => {
  it('transliterates cyrillic to slug segments', () => {
    expect(slugFromTitle('Обзор студии в Москве')).toBe('обзор-студии-в-москве')
  })

  it('falls back to post for empty input', () => {
    expect(slugFromTitle('   ')).toBe('post')
  })
})
