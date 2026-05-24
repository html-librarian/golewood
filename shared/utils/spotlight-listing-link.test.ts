import { describe, expect, it } from 'vitest'
import { normalizeInstagramInput, parseListingIdFromInput } from './spotlight-listing-link'

describe('parseListingIdFromInput', () => {
  const id = '00000000-0000-4000-8000-000000000099'

  it('parses bare uuid', () => {
    expect(parseListingIdFromInput(id)).toBe(id)
  })

  it('parses relative listing path', () => {
    expect(parseListingIdFromInput(`/listings/${id}`)).toBe(id)
  })

  it('parses absolute listing url', () => {
    expect(parseListingIdFromInput(`https://golewood.ru/listings/${id}?x=1`)).toBe(id)
  })
})

describe('normalizeInstagramInput', () => {
  it('normalizes @handle', () => {
    expect(normalizeInstagramInput('@glamping_ru')).toBe('https://instagram.com/glamping_ru')
  })
})
