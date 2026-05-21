import { describe, expect, it } from 'vitest'
import { buildYandexMapsUrl, hasValidMapCoordinates } from './map-coordinates'

describe('map-coordinates', () => {
  it('rejects zero island', () => {
    expect(hasValidMapCoordinates(0, 0)).toBe(false)
  })

  it('accepts real coordinates', () => {
    expect(hasValidMapCoordinates(55.757, 37.615)).toBe(true)
  })

  it('builds yandex maps link', () => {
    expect(buildYandexMapsUrl(55.75, 37.62)).toBe('https://yandex.ru/maps/?pt=37.62,55.75&z=15&l=map')
  })
})
