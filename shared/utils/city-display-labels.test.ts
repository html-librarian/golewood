import { describe, expect, it } from 'vitest'
import { resolveCityDisplayLabels } from './city-display-labels'

describe('resolveCityDisplayLabels', () => {
  it('returns English label for known Russian city name', () => {
    expect(resolveCityDisplayLabels('Курск')).toEqual({
      searchCity: 'Курск',
      labelRu: 'Курск',
      labelEn: 'Kursk',
    })
  })

  it('resolves when profile stores English name', () => {
    expect(resolveCityDisplayLabels('Kursk')).toEqual({
      searchCity: 'Курск',
      labelRu: 'Курск',
      labelEn: 'Kursk',
    })
  })

  it('falls back to raw name for unknown cities', () => {
    expect(resolveCityDisplayLabels('Мой посёлок')).toEqual({
      searchCity: 'Мой посёлок',
      labelRu: 'Мой посёлок',
      labelEn: 'Мой посёлок',
    })
  })
})
