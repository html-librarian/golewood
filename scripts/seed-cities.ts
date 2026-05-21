import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { and, eq } from 'drizzle-orm'
import { cities, countries } from '../server/db/schema/index.ts'
import { DEFAULT_COUNTRY_CODE } from '../shared/catalog/countries.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const citiesPath = join(__dirname, '../shared/catalog/cities-ru.json')

interface CitySeedRow {
  name: string
  nameEn: string
  sortOrder: number
}

const databaseUrl = process.env.NUXT_DATABASE_URL
  ?? 'postgresql://golewood:golewood@localhost:5433/golewood'

const sql = postgres(databaseUrl)
const db = drizzle(sql)

const seedRussiaCities = async () => {
  const raw = readFileSync(citiesPath, 'utf8')
  const rows = JSON.parse(raw) as CitySeedRow[]

  const [country] = await db.select().from(countries).where(eq(countries.code, DEFAULT_COUNTRY_CODE)).limit(1)

  if (!country) {
    throw new Error(`Country ${DEFAULT_COUNTRY_CODE} not found. Run db:migrate first.`)
  }

  let inserted = 0
  let updated = 0

  for (const row of rows) {
    const [existing] = await db.select({ id: cities.id }).from(cities)
      .where(and(eq(cities.countryId, country.id), eq(cities.name, row.name)))
      .limit(1)

    if (existing) {
      await db.update(cities).set({
        nameEn: row.nameEn,
        sortOrder: row.sortOrder,
        active: true,
      }).where(eq(cities.id, existing.id))
      updated++
      continue
    }

    await db.insert(cities).values({
      countryId: country.id,
      name: row.name,
      nameEn: row.nameEn,
      sortOrder: row.sortOrder,
      active: true,
    })
    inserted++
  }

  console.log(`Russia cities: ${inserted} inserted, ${updated} updated (${rows.length} in catalog)`)
}

seedRussiaCities()
  .then(() => sql.end())
  .catch((err) => {
    console.error(err)
    sql.end().finally(() => process.exit(1))
  })
