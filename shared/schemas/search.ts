import { z } from 'zod'
import { SEARCH_SORTS } from '../types/search'
import { emptyToUndefined } from '../utils/zod'

export const searchParamsSchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  city: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  checkIn: z.preprocess(emptyToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  checkOut: z.preprocess(emptyToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  guests: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).optional()),
  minPrice: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional()),
  maxPrice: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional()),
  amenities: z.preprocess(
    (value) => {
      if (!value || value === '') {
        return undefined
      }

      if (Array.isArray(value)) {
        return value.filter(Boolean)
      }

      return String(value).split(',').filter(Boolean)
    },
    z.array(z.string().regex(/^[a-z0-9_]+$/)).optional(),
  ),
  accommodationTypes: z.preprocess(
    (value) => {
      if (!value || value === '') {
        return undefined
      }

      if (Array.isArray(value)) {
        return value.filter(Boolean)
      }

      return String(value).split(',').filter(Boolean)
    },
    z.array(z.string().regex(/^[a-z0-9_]+$/)).optional(),
  ),
  lat: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
  lng: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
  radius: z.preprocess(emptyToUndefined, z.coerce.number().min(1).max(500).optional()),
  sort: z.preprocess(emptyToUndefined, z.enum(SEARCH_SORTS).optional()),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).optional()),
  pageSize: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(50).optional()),
  teamCatalog: z.preprocess(
    (value) => value === true || value === 'true' || value === '1' || value === 1,
    z.boolean().optional(),
  ),
  teamBadgeSlugs: z.preprocess(
    (value) => {
      if (!value || value === '') {
        return undefined
      }

      if (Array.isArray(value)) {
        return value.filter(Boolean)
      }

      return String(value).split(',').filter(Boolean)
    },
    z.array(z.string().regex(/^[a-z0-9_]+$/)).optional(),
  ),
}).refine(
  data => !data.checkIn || !data.checkOut || data.checkOut > data.checkIn,
  { message: 'checkOut must be after checkIn' },
)

export type SearchParamsInput = z.infer<typeof searchParamsSchema>
