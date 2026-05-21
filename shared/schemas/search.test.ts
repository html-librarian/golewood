import { describe, expect, it } from 'vitest'
import { searchParamsSchema } from './search'

describe('searchParamsSchema', () => {
  it('accepts guests only', () => {
    const result = searchParamsSchema.parse({ guests: '2' })
    expect(result.guests).toBe(2)
  })

  it('treats empty sort and dates as undefined', () => {
    const result = searchParamsSchema.parse({
      guests: '2',
      sort: '',
      checkIn: '',
      checkOut: '',
      minPrice: '',
      maxPrice: '',
    })

    expect(result.sort).toBeUndefined()
    expect(result.checkIn).toBeUndefined()
    expect(result.checkOut).toBeUndefined()
    expect(result.minPrice).toBeUndefined()
    expect(result.maxPrice).toBeUndefined()
  })

  it('parses team badge slugs', () => {
    const result = searchParamsSchema.parse({
      guests: '2',
      teamBadgeSlugs: 'team_visited',
    })

    expect(result.teamBadgeSlugs).toEqual(['team_visited'])
  })

  it('parses pagination', () => {
    const result = searchParamsSchema.parse({ page: '2', pageSize: '24' })

    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(24)
  })
})
