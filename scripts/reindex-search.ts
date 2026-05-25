/**
 * Sync Meilisearch listings index with PostgreSQL (published only).
 * Run on VPS: docker compose exec -T app npm run search:reindex
 */
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { and, asc, eq, ne } from 'drizzle-orm'
import { Meilisearch } from 'meilisearch'
import { listingPhotos, listings } from '../server/db/schema/index.ts'

const databaseUrl = process.env.NUXT_DATABASE_URL

if (!databaseUrl) {
  console.error('NUXT_DATABASE_URL is required')
  process.exit(1)
}

const meiliHost = process.env.NUXT_MEILI_HOST ?? 'http://localhost:7700'
const meiliApiKey = process.env.NUXT_MEILI_API_KEY ?? ''

const sql = postgres(databaseUrl)
const db = drizzle(sql)

const ensureIndex = async (client: Meilisearch) => {
  const index = client.index('listings')

  try {
    await index.getRawInfo()
  } catch {
    await client.createIndex('listings', { primaryKey: 'id' })
  }

  await index.updateFilterableAttributes([
    'status',
    'city',
    'pricePerNight',
    'maxGuests',
    'bedrooms',
    'amenities',
    'accommodationTypes',
    'managedByTeam',
    '_geo',
  ])

  await index.updateSortableAttributes([
    'pricePerNight',
    'boostScore',
    'highlightScore',
    'cityPinScore',
  ])

  return index
}

const reindex = async () => {
  const client = new Meilisearch({ host: meiliHost, apiKey: meiliApiKey || undefined })
  const index = await ensureIndex(client)

  const rows = await db.select().from(listings).where(and(
    eq(listings.status, 'published'),
    ne(listings.kind, 'unit'),
  ))

  const documents = []

  for (const row of rows) {
    const [photo] = await db.select().from(listingPhotos)
      .where(eq(listingPhotos.listingId, row.id))
      .orderBy(asc(listingPhotos.sortOrder))
      .limit(1)

    documents.push({
      id: row.id,
      status: 'published' as const,
      title: row.title,
      description: row.description,
      city: row.city,
      address: row.address,
      pricePerNight: row.pricePerNight,
      maxGuests: row.maxGuests,
      bedrooms: row.bedrooms,
      amenities: row.amenities ?? [],
      accommodationTypes: row.accommodationType ? [row.accommodationType] : [],
      latitude: row.latitude,
      longitude: row.longitude,
      coverPhotoUrl: photo?.url ?? null,
      managedByTeam: row.managedByTeam,
      boostScore: 0,
      highlightScore: 0,
      cityPinScore: 0,
      _geo: row.latitude && row.longitude
        ? { lat: row.latitude, lng: row.longitude }
        : null,
    })
  }

  await index.deleteAllDocuments()

  if (documents.length) {
    await index.addDocuments(documents)
  }

  return documents.length
}

const main = async () => {
  const count = await reindex()
  console.log(`Meilisearch: reindexed ${count} published listing(s)`)
  await sql.end()
}

main().catch(async (err) => {
  const cause = err && typeof err === 'object' && 'cause' in err
    ? (err as { cause?: { message?: string } }).cause?.message
    : undefined

  if (cause?.includes('does not exist')) {
    console.error('Database schema is out of date. Run: npm run db:migrate')
    console.error(cause)
  } else {
    console.error(err)
  }

  await sql.end()
  process.exit(1)
})
