import { amenityCatalog } from '../db/schema'
import { getDb } from '../utils/db'
import { isMissingRelationError } from '../utils/db-errors'

export default defineNitroPlugin(() => {
  if (!import.meta.dev) {
    return
  }

  const check = async () => {
    try {
      const db = getDb()
      await db.select().from(amenityCatalog).limit(1)
    } catch (error) {
      if (isMissingRelationError(error)) {
        console.warn(
          '[golewood] Database schema is outdated (missing amenity_catalog). Run: npm run db:migrate',
        )
      }
    }
  }

  void check()
})
