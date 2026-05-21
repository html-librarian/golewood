import { z } from 'zod'
import { AMENITY_CATEGORIES } from '#shared/catalog/amenity-categories'
import { CATALOG_COUNTRIES } from '#shared/catalog/countries'

const countryCodeSchema = z.enum(CATALOG_COUNTRIES.map(c => c.code))

export const createCitySchema = z.object({
  name: z.string().trim().min(2).max(128),
  nameEn: z.string().trim().max(128).optional(),
  countryCode: countryCodeSchema.default('RU'),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
})

export const updateCitySchema = createCitySchema.partial()

export const createAmenitySchema = z.object({
  slug: z.string().trim().min(2).max(64).regex(/^[a-z0-9_]+$/),
  icon: z.string().trim().min(3).max(128),
  labelRu: z.string().trim().min(1).max(128),
  labelEn: z.string().trim().min(1).max(128),
  category: z.enum(AMENITY_CATEGORIES).default('comfort'),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
})

export const updateAmenitySchema = createAmenitySchema.partial()

export const addListingVideoSchema = z.object({
  url: z.string().trim().url().max(512),
})

export const reorderListingMediaSchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1),
})

export type CreateCityInput = z.infer<typeof createCitySchema>
export type UpdateCityInput = z.infer<typeof updateCitySchema>
export type CreateAmenityInput = z.infer<typeof createAmenitySchema>
export type UpdateAmenityInput = z.infer<typeof updateAmenitySchema>
