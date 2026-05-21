import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema'

let sql: ReturnType<typeof postgres> | null = null
let db: PostgresJsDatabase<typeof schema> | null = null

export const getDb = () => {
  if (!db) {
    const config = useRuntimeConfig()
    sql = postgres(config.databaseUrl, {
      max: 10,
      connect_timeout: 5,
      idle_timeout: 20,
    })
    db = drizzle(sql, { schema })
  }

  return db
}

export const closeDb = async () => {
  if (sql) {
    await sql.end()
    sql = null
    db = null
  }
}

export { schema }
