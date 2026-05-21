import { normalizeAmenityCategory } from '#shared/catalog/amenity-categories'
import { DEFAULT_COUNTRY_CODE } from '#shared/catalog/countries'
import type { CatalogCountryCode } from '#shared/catalog/countries'
import type { AccommodationTypeCatalogItem, AmenityCatalogItem, City, Country } from '#shared/types/catalog'
import type { CreateAmenityInput, CreateCityInput, UpdateAmenityInput, UpdateCityInput } from '#shared/schemas/catalog'
import { and, asc, eq, ilike, inArray, or } from 'drizzle-orm'
import { accommodationTypeCatalog, amenityCatalog, cities, countries } from '../db/schema'
import { getDb } from '../utils/db'

type CityRow = typeof cities.$inferSelect & {
  countryCode: string
}

const mapCountry = (row: typeof countries.$inferSelect): Country => ({
  id: row.id,
  code: row.code as CatalogCountryCode,
  nameRu: row.nameRu,
  nameEn: row.nameEn,
  active: row.active,
  sortOrder: row.sortOrder,
})

const mapCity = (row: CityRow): City => ({
  id: row.id,
  countryId: row.countryId,
  countryCode: row.countryCode as CatalogCountryCode,
  name: row.name,
  nameEn: row.nameEn,
  active: row.active,
  sortOrder: row.sortOrder,
})

const citySelect = () => ({
  id: cities.id,
  countryId: cities.countryId,
  countryCode: countries.code,
  name: cities.name,
  nameEn: cities.nameEn,
  active: cities.active,
  sortOrder: cities.sortOrder,
  createdAt: cities.createdAt,
})

const resolveCountryId = async (code: CatalogCountryCode) => {
  const db = getDb()
  const [row] = await db.select({ id: countries.id }).from(countries).where(eq(countries.code, code)).limit(1)

  if (!row) {
    throw createError({ statusCode: 400, statusMessage: `Unknown country: ${code}` })
  }

  return row.id
}

export const catalogService = {
  listCountries: async (activeOnly = true): Promise<Country[]> => {
    const db = getDb()
    const rows = await db.select().from(countries)
      .where(activeOnly ? eq(countries.active, true) : undefined)
      .orderBy(asc(countries.sortOrder), asc(countries.nameRu))

    return rows.map(mapCountry)
  },

  listCities: async (options?: {
    query?: string
    countryCode?: CatalogCountryCode
    activeOnly?: boolean
  }): Promise<City[]> => {
    const db = getDb()
    const { query, countryCode = DEFAULT_COUNTRY_CODE, activeOnly = true } = options ?? {}
    const conditions = []

    if (activeOnly) {
      conditions.push(eq(cities.active, true))
    }

    const countryId = await resolveCountryId(countryCode)
    conditions.push(eq(cities.countryId, countryId))

    const trimmed = query?.trim()
    if (trimmed) {
      const pattern = `%${trimmed}%`
      conditions.push(or(ilike(cities.name, pattern), ilike(cities.nameEn, pattern))!)
    }

    const rows = await db.select(citySelect()).from(cities)
      .innerJoin(countries, eq(cities.countryId, countries.id))
      .where(and(...conditions))
      .orderBy(asc(cities.sortOrder), asc(cities.name))

    return rows.map(mapCity)
  },

  assertCityName: async (name: string, countryCode: CatalogCountryCode = DEFAULT_COUNTRY_CODE) => {
    const db = getDb()
    const countryId = await resolveCountryId(countryCode)

    const [row] = await db.select(citySelect()).from(cities)
      .innerJoin(countries, eq(cities.countryId, countries.id))
      .where(and(
        eq(cities.countryId, countryId),
        eq(cities.name, name),
        eq(cities.active, true),
      ))
      .limit(1)

    if (!row) {
      throw createError({ statusCode: 400, statusMessage: 'City is not available. Select a city from the list.' })
    }

    return mapCity(row)
  },

  listAmenities: async (activeOnly = true): Promise<AmenityCatalogItem[]> => {
    const db = getDb()
    const rows = await db.select().from(amenityCatalog)
      .where(activeOnly ? eq(amenityCatalog.active, true) : undefined)
      .orderBy(asc(amenityCatalog.sortOrder), asc(amenityCatalog.labelRu))

    return rows.map(row => ({
      id: row.id,
      slug: row.slug,
      icon: row.icon,
      labelRu: row.labelRu,
      labelEn: row.labelEn,
      category: normalizeAmenityCategory(row.category),
      active: row.active,
      sortOrder: row.sortOrder,
    }))
  },

  listAccommodationTypes: async (activeOnly = true): Promise<AccommodationTypeCatalogItem[]> => {
    const db = getDb()
    const rows = await db.select().from(accommodationTypeCatalog)
      .where(activeOnly ? eq(accommodationTypeCatalog.active, true) : undefined)
      .orderBy(asc(accommodationTypeCatalog.sortOrder), asc(accommodationTypeCatalog.labelRu))

    return rows.map(row => ({
      slug: row.slug,
      icon: row.icon,
      labelRu: row.labelRu,
      labelEn: row.labelEn,
      active: row.active,
      sortOrder: row.sortOrder,
    }))
  },

  validateAccommodationType: async (slug: string | null | undefined) => {
    if (!slug) {
      return
    }

    const db = getDb()
    const [row] = await db.select({ slug: accommodationTypeCatalog.slug }).from(accommodationTypeCatalog)
      .where(and(eq(accommodationTypeCatalog.slug, slug), eq(accommodationTypeCatalog.active, true)))
      .limit(1)

    if (!row) {
      throw createError({ statusCode: 400, statusMessage: `Unknown accommodation type: ${slug}` })
    }
  },

  validateAmenitySlugs: async (slugs: string[]) => {
    if (!slugs.length) {
      return
    }

    const db = getDb()
    const rows = await db.select({ slug: amenityCatalog.slug }).from(amenityCatalog)
      .where(and(inArray(amenityCatalog.slug, slugs), eq(amenityCatalog.active, true)))

    const allowed = new Set(rows.map(row => row.slug))
    const invalid = slugs.filter(slug => !allowed.has(slug))

    if (invalid.length) {
      throw createError({
        statusCode: 400,
        statusMessage: `Unknown amenities: ${invalid.join(', ')}`,
      })
    }
  },

  createCity: async (input: CreateCityInput) => {
    const db = getDb()
    const countryId = await resolveCountryId(input.countryCode)

    const [row] = await db.insert(cities).values({
      countryId,
      name: input.name,
      nameEn: input.nameEn ?? null,
      active: input.active,
      sortOrder: input.sortOrder,
    }).returning()

    const [withCountry] = await db.select(citySelect()).from(cities)
      .innerJoin(countries, eq(cities.countryId, countries.id))
      .where(eq(cities.id, row.id))
      .limit(1)

    return mapCity(withCountry)
  },

  updateCity: async (id: string, input: UpdateCityInput) => {
    const db = getDb()
    const patch: Partial<typeof cities.$inferInsert> = {}

    if (input.countryCode !== undefined) {
      patch.countryId = await resolveCountryId(input.countryCode)
    }
    if (input.name !== undefined) {
      patch.name = input.name
    }
    if (input.active !== undefined) {
      patch.active = input.active
    }
    if (input.sortOrder !== undefined) {
      patch.sortOrder = input.sortOrder
    }
    if (input.nameEn !== undefined) {
      patch.nameEn = input.nameEn ?? null
    }

    const [row] = await db.update(cities).set(patch).where(eq(cities.id, id)).returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'City not found' })
    }

    const [withCountry] = await db.select(citySelect()).from(cities)
      .innerJoin(countries, eq(cities.countryId, countries.id))
      .where(eq(cities.id, row.id))
      .limit(1)

    return mapCity(withCountry)
  },

  createAmenity: async (input: CreateAmenityInput) => {
    const db = getDb()
    const [row] = await db.insert(amenityCatalog).values(input).returning()
    return {
      id: row.id,
      slug: row.slug,
      icon: row.icon,
      labelRu: row.labelRu,
      labelEn: row.labelEn,
      category: normalizeAmenityCategory(row.category),
      active: row.active,
      sortOrder: row.sortOrder,
    }
  },

  updateAmenity: async (id: string, input: UpdateAmenityInput) => {
    const db = getDb()
    const [row] = await db.update(amenityCatalog).set(input).where(eq(amenityCatalog.id, id)).returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Amenity not found' })
    }

    return {
      id: row.id,
      slug: row.slug,
      icon: row.icon,
      labelRu: row.labelRu,
      labelEn: row.labelEn,
      category: normalizeAmenityCategory(row.category),
      active: row.active,
      sortOrder: row.sortOrder,
    }
  },
}
