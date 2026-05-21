import { DEFAULT_COUNTRY_CODE } from '#shared/catalog/countries'
import type { CatalogCountryCode } from '#shared/catalog/countries'
import { catalogService } from '../../services/catalog.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = typeof query.q === 'string' ? query.q : undefined
  const countryRaw = typeof query.country === 'string' ? query.country.toUpperCase() : DEFAULT_COUNTRY_CODE
  const countryCode = countryRaw as CatalogCountryCode

  return catalogService.listCities({ query: q, countryCode, activeOnly: true })
})
