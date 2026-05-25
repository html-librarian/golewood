import { homePromoHasPhoto } from '#shared/utils/home-promo-display'
import type { HomePromoBanner, HomePromoImageBreakpoint, HomePromoSection } from '#shared/types/home-promo'
import type { CreateHomePromoBannerInput, UpdateHomePromoBannerInput } from '#shared/schemas/home-promo'
import { asc, eq } from 'drizzle-orm'
import { homePromoBanners } from '../db/schema'
import { getDb } from '../utils/db'
import { saveHomePromoImage } from '../utils/storage'

const mapRow = (row: typeof homePromoBanners.$inferSelect): HomePromoBanner => ({
  id: row.id,
  slot: row.slot,
  titleRu: row.titleRu,
  titleEn: row.titleEn,
  subtitleRu: row.subtitleRu,
  subtitleEn: row.subtitleEn,
  ctaRu: row.ctaRu,
  ctaEn: row.ctaEn,
  linkHref: row.linkHref,
  linkExternal: row.linkExternal,
  backgroundMode: row.backgroundMode,
  tone: row.tone,
  imageDesktopUrl: row.imageDesktopUrl,
  imageTabletUrl: row.imageTabletUrl,
  imageMobileUrl: row.imageMobileUrl,
  active: row.active,
  sortOrder: row.sortOrder,
})

const imagePatch = (
  breakpoint: HomePromoImageBreakpoint,
  imageUrl: string | null,
): Partial<typeof homePromoBanners.$inferInsert> => {
  if (breakpoint === 'desktop') {
    return { imageDesktopUrl: imageUrl }
  }

  if (breakpoint === 'tablet') {
    return { imageTabletUrl: imageUrl }
  }

  return { imageMobileUrl: imageUrl }
}

export const homePromoService = {
  getPublicSection: async (): Promise<HomePromoSection> => {
    const db = getDb()
    const rows = await db.select().from(homePromoBanners)
      .where(eq(homePromoBanners.active, true))
      .orderBy(asc(homePromoBanners.sortOrder), asc(homePromoBanners.createdAt))

    const featured = rows.filter(row => row.slot === 'featured')[0] ?? null
    const carousel = rows.filter(row => row.slot === 'carousel')

    return {
      featured: featured ? mapRow(featured) : null,
      carousel: carousel.map(mapRow),
    }
  },

  listAdmin: async (): Promise<HomePromoBanner[]> => {
    const db = getDb()
    const rows = await db.select().from(homePromoBanners)
      .orderBy(asc(homePromoBanners.slot), asc(homePromoBanners.sortOrder), asc(homePromoBanners.createdAt))

    return rows.map(mapRow)
  },

  create: async (input: CreateHomePromoBannerInput): Promise<HomePromoBanner> => {
    const db = getDb()
    const slotRows = await db.select({ sortOrder: homePromoBanners.sortOrder })
      .from(homePromoBanners)
      .where(eq(homePromoBanners.slot, input.slot))
      .orderBy(asc(homePromoBanners.sortOrder))

    const maxOrder = slotRows.at(-1)?.sortOrder ?? -1

    const [row] = await db.insert(homePromoBanners).values({
      slot: input.slot,
      titleRu: input.titleRu ?? null,
      titleEn: input.titleEn ?? null,
      subtitleRu: input.subtitleRu ?? null,
      subtitleEn: input.subtitleEn ?? null,
      ctaRu: input.ctaRu ?? null,
      ctaEn: input.ctaEn ?? null,
      linkHref: input.linkHref,
      linkExternal: input.linkExternal ?? false,
      backgroundMode: input.backgroundMode ?? 'gradient',
      tone: input.tone ?? 'from-brand-600 to-teal-700',
      active: input.active ?? true,
      sortOrder: maxOrder + 1,
    }).returning()

    return mapRow(row)
  },

  update: async (id: string, input: UpdateHomePromoBannerInput): Promise<HomePromoBanner> => {
    const db = getDb()
    const patch: Partial<typeof homePromoBanners.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.titleRu !== undefined) patch.titleRu = input.titleRu
    if (input.titleEn !== undefined) patch.titleEn = input.titleEn
    if (input.subtitleRu !== undefined) patch.subtitleRu = input.subtitleRu
    if (input.subtitleEn !== undefined) patch.subtitleEn = input.subtitleEn
    if (input.ctaRu !== undefined) patch.ctaRu = input.ctaRu
    if (input.ctaEn !== undefined) patch.ctaEn = input.ctaEn
    if (input.linkHref !== undefined) patch.linkHref = input.linkHref
    if (input.linkExternal !== undefined) patch.linkExternal = input.linkExternal
    if (input.backgroundMode !== undefined) patch.backgroundMode = input.backgroundMode
    if (input.tone !== undefined) patch.tone = input.tone
    if (input.active !== undefined) patch.active = input.active
    if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder

    const [row] = await db.update(homePromoBanners).set(patch).where(eq(homePromoBanners.id, id)).returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Promo banner not found' })
    }

    return mapRow(row)
  },

  delete: async (id: string) => {
    const db = getDb()
    const [row] = await db.delete(homePromoBanners).where(eq(homePromoBanners.id, id)).returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Promo banner not found' })
    }
  },

  move: async (id: string, direction: 'up' | 'down'): Promise<HomePromoBanner[]> => {
    const db = getDb()
    const [current] = await db.select().from(homePromoBanners).where(eq(homePromoBanners.id, id)).limit(1)

    if (!current) {
      throw createError({ statusCode: 404, statusMessage: 'Promo banner not found' })
    }

    const siblings = await db.select().from(homePromoBanners)
      .where(eq(homePromoBanners.slot, current.slot))
      .orderBy(asc(homePromoBanners.sortOrder), asc(homePromoBanners.createdAt))

    const index = siblings.findIndex(row => row.id === id)

    if (index < 0) {
      throw createError({ statusCode: 404, statusMessage: 'Promo banner not found' })
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const target = siblings[targetIndex]

    if (!target) {
      return siblings.map(mapRow)
    }

    await db.update(homePromoBanners)
      .set({ sortOrder: target.sortOrder, updatedAt: new Date() })
      .where(eq(homePromoBanners.id, current.id))

    await db.update(homePromoBanners)
      .set({ sortOrder: current.sortOrder, updatedAt: new Date() })
      .where(eq(homePromoBanners.id, target.id))

    return homePromoService.listAdmin()
  },

  uploadImage: async (
    id: string,
    breakpoint: HomePromoImageBreakpoint,
    file: { data: Buffer, filename?: string, type?: string },
  ): Promise<HomePromoBanner> => {
    const db = getDb()
    const imageUrl = await saveHomePromoImage(id, breakpoint, file)

    const [row] = await db.update(homePromoBanners)
      .set({
        ...imagePatch(breakpoint, imageUrl),
        backgroundMode: 'image',
        updatedAt: new Date(),
      })
      .where(eq(homePromoBanners.id, id))
      .returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Promo banner not found' })
    }

    return mapRow(row)
  },

  clearImage: async (id: string, breakpoint: HomePromoImageBreakpoint): Promise<HomePromoBanner> => {
    const db = getDb()
    const [row] = await db.update(homePromoBanners)
      .set({
        ...imagePatch(breakpoint, null),
        updatedAt: new Date(),
      })
      .where(eq(homePromoBanners.id, id))
      .returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Promo banner not found' })
    }

    const mapped = mapRow(row)

    if (!homePromoHasPhoto(mapped)) {
      const [withGradient] = await db.update(homePromoBanners)
        .set({ backgroundMode: 'gradient', updatedAt: new Date() })
        .where(eq(homePromoBanners.id, id))
        .returning()

      return mapRow(withGradient ?? row)
    }

    return mapped
  },
}
