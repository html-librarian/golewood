import { sql } from 'drizzle-orm'
import { getDb } from './db'

export const syncListingLocation = async (
  listingId: string,
  latitude: number,
  longitude: number,
) => {
  if (!latitude && !longitude) {
    return
  }

  const db = getDb()

  await db.execute(sql`
    UPDATE listings
    SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
    WHERE id = ${listingId}
  `)
}

export const backfillListingLocations = async () => {
  const db = getDb()

  await db.execute(sql`
    UPDATE listings
    SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    WHERE location IS NULL
      AND (latitude <> 0 OR longitude <> 0)
  `)
}
