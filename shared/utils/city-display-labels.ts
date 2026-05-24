import citiesCatalog from '#shared/catalog/cities-ru.json'

export interface CityDisplayLabels {
  /** Canonical Russian name for search/API. */
  searchCity: string
  labelRu: string
  labelEn: string
}

const normalize = (value: string) => value.trim().toLowerCase()

const findCityInCatalog = (city: string) => {
  const target = normalize(city)

  if (!target) {
    return null
  }

  return citiesCatalog.find(entry =>
    normalize(entry.name) === target
    || normalize(entry.nameEn) === target,
  ) ?? null
}

/** Maps a profile/geo city string to localized labels; search always uses Russian name when known. */
export const resolveCityDisplayLabels = (city: string): CityDisplayLabels => {
  const trimmed = city.trim()
  const entry = findCityInCatalog(trimmed)

  if (entry) {
    return {
      searchCity: entry.name,
      labelRu: entry.name,
      labelEn: entry.nameEn,
    }
  }

  return {
    searchCity: trimmed,
    labelRu: trimmed,
    labelEn: trimmed,
  }
}
