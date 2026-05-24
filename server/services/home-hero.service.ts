import type { HomeHero, HomeHeroAdminSettings, HomeHeroMode } from '#shared/types/home-hero'
import { HOME_HERO_MODES } from '#shared/types/home-hero'
import type { UpdateHomeHeroSettingsInput } from '#shared/schemas/home-hero'
import { resolveHomeHero, type HomeHeroSettingsRow } from '#shared/utils/home-hero-resolve'
import { eq } from 'drizzle-orm'
import { homeHeroSettings } from '../db/schema'
import { getDb } from '../utils/db'
import { saveHomeHeroBanner } from '../utils/storage'
import { spotlightService } from './spotlight.service'

const SETTINGS_ID = 'default'

const parseMode = (value: string): HomeHeroMode =>
  HOME_HERO_MODES.includes(value as HomeHeroMode) ? value as HomeHeroMode : 'auto'

const mapSettingsRow = (row: typeof homeHeroSettings.$inferSelect): HomeHeroSettingsRow => ({
  mode: parseMode(row.mode),
  imageUrl: row.imageUrl,
  creditRu: row.creditRu,
  creditEn: row.creditEn,
})

const getSettingsRow = async () => {
  const db = getDb()
  const [row] = await db.select().from(homeHeroSettings).where(eq(homeHeroSettings.id, SETTINGS_ID)).limit(1)

  if (row) {
    return row
  }

  const [created] = await db.insert(homeHeroSettings).values({ id: SETTINGS_ID }).returning()
  return created
}

const toAdminSettings = async (row: typeof homeHeroSettings.$inferSelect): Promise<HomeHeroAdminSettings> => {
  const settings = mapSettingsRow(row)
  const contest = await spotlightService.getHero()

  return {
    mode: settings.mode,
    imageUrl: settings.imageUrl,
    creditRu: settings.creditRu,
    creditEn: settings.creditEn,
    updatedAt: row.updatedAt.toISOString(),
    resolved: resolveHomeHero(settings, contest),
  }
}

export const homeHeroService = {
  getHero: async (): Promise<HomeHero> => {
    const row = await getSettingsRow()
    const contest = await spotlightService.getHero()
    return resolveHomeHero(mapSettingsRow(row), contest)
  },

  getAdminSettings: async (): Promise<HomeHeroAdminSettings> => {
    const row = await getSettingsRow()
    return toAdminSettings(row)
  },

  updateSettings: async (input: UpdateHomeHeroSettingsInput): Promise<HomeHeroAdminSettings> => {
    const db = getDb()
    const patch: Partial<typeof homeHeroSettings.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.mode !== undefined) {
      patch.mode = input.mode
    }

    if (input.creditRu !== undefined) {
      patch.creditRu = input.creditRu
    }

    if (input.creditEn !== undefined) {
      patch.creditEn = input.creditEn
    }

    const [row] = await db.update(homeHeroSettings)
      .set(patch)
      .where(eq(homeHeroSettings.id, SETTINGS_ID))
      .returning()

    return toAdminSettings(row)
  },

  uploadBanner: async (file: { data: Buffer, filename?: string, type?: string }): Promise<HomeHeroAdminSettings> => {
    const imageUrl = await saveHomeHeroBanner(file)
    const db = getDb()

    const [row] = await db.update(homeHeroSettings)
      .set({
        imageUrl,
        mode: 'custom',
        updatedAt: new Date(),
      })
      .where(eq(homeHeroSettings.id, SETTINGS_ID))
      .returning()

    return toAdminSettings(row)
  },

  clearBanner: async (): Promise<HomeHeroAdminSettings> => {
    const db = getDb()

    const [row] = await db.update(homeHeroSettings)
      .set({
        imageUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(homeHeroSettings.id, SETTINGS_ID))
      .returning()

    return toAdminSettings(row)
  },
}
