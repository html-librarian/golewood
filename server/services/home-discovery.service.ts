import type { HomeDiscoveryFilter, HomeDiscoveryGroup } from '#shared/catalog/home-discovery'
import { HOME_DISCOVERY_GROUPS } from '#shared/catalog/home-discovery'
import type { HomeDiscoveryAdminGroup, HomeDiscoveryAdminItem } from '#shared/types/home-discovery-admin'
import type { CreateHomeDiscoveryItemInput, UpdateHomeDiscoveryItemInput } from '#shared/schemas/home-discovery'
import { asc, eq, sql } from 'drizzle-orm'
import { homeDiscoveryGroups, homeDiscoveryItems } from '../db/schema'
import { getDb } from '../utils/db'
import { saveHomeDiscoveryImage } from '../utils/storage'

const mapParams = (raw: Record<string, unknown>) => {
  const params: HomeDiscoveryFilter['params'] = {}

  if (typeof raw.city === 'string' && raw.city.trim()) {
    params.city = raw.city.trim()
  }

  if (Array.isArray(raw.amenities)) {
    params.amenities = raw.amenities.filter((item): item is string => typeof item === 'string')
  }

  if (Array.isArray(raw.teamBadgeSlugs)) {
    params.teamBadgeSlugs = raw.teamBadgeSlugs.filter((item): item is string => typeof item === 'string')
  }

  if (Array.isArray(raw.accommodationTypes)) {
    params.accommodationTypes = raw.accommodationTypes.filter((item): item is string => typeof item === 'string')
  }

  return params
}

const mapRowToAdminItem = (row: typeof homeDiscoveryItems.$inferSelect): HomeDiscoveryAdminItem => ({
  id: row.id,
  itemKey: row.itemKey,
  groupId: row.groupId,
  labelRu: row.labelRu,
  labelEn: row.labelEn,
  icon: row.icon,
  tone: row.tone,
  imageUrl: row.imageUrl,
  params: mapParams(row.params as Record<string, unknown>),
  active: row.active,
  sortOrder: row.sortOrder,
})

const mapItemToFilter = (row: typeof homeDiscoveryItems.$inferSelect): HomeDiscoveryFilter => ({
  id: row.itemKey,
  labelRu: row.labelRu,
  labelEn: row.labelEn,
  icon: row.icon,
  tone: row.tone,
  imageUrl: row.imageUrl,
  params: mapParams(row.params as Record<string, unknown>),
})

export const homeDiscoveryService = {
  listGroups: async (activeOnly = true): Promise<HomeDiscoveryGroup[]> => {
    const db = getDb()
    const groups = await db.select().from(homeDiscoveryGroups).orderBy(asc(homeDiscoveryGroups.sortOrder))
    const items = await db.select().from(homeDiscoveryItems)
      .where(activeOnly ? eq(homeDiscoveryItems.active, true) : undefined)
      .orderBy(asc(homeDiscoveryItems.sortOrder), asc(homeDiscoveryItems.labelRu))

    if (!groups.length) {
      return HOME_DISCOVERY_GROUPS
    }

    const itemsByGroup = new Map<string, HomeDiscoveryFilter[]>()

    for (const row of items) {
      const list = itemsByGroup.get(row.groupId) ?? []
      list.push(mapItemToFilter(row))
      itemsByGroup.set(row.groupId, list)
    }

    const mapped = groups
      .map(group => ({
        id: group.id,
        titleRu: group.titleRu,
        titleEn: group.titleEn,
        filters: itemsByGroup.get(group.id) ?? [],
      }))
      .filter(group => group.filters.length > 0)

    return mapped.length ? mapped : HOME_DISCOVERY_GROUPS
  },

  listAdminGroups: async (): Promise<HomeDiscoveryAdminGroup[]> => {
    const db = getDb()
    const groups = await db.select().from(homeDiscoveryGroups).orderBy(asc(homeDiscoveryGroups.sortOrder))
    const items = await db.select().from(homeDiscoveryItems)
      .orderBy(asc(homeDiscoveryItems.sortOrder), asc(homeDiscoveryItems.itemKey))

    const itemsByGroup = new Map<string, typeof items>()

    for (const row of items) {
      const list = itemsByGroup.get(row.groupId) ?? []
      list.push(row)
      itemsByGroup.set(row.groupId, list)
    }

    return groups.map(group => ({
      id: group.id,
      titleRu: group.titleRu,
      titleEn: group.titleEn,
      sortOrder: group.sortOrder,
      items: (itemsByGroup.get(group.id) ?? []).map(mapRowToAdminItem),
    }))
  },

  createItem: async (input: CreateHomeDiscoveryItemInput): Promise<HomeDiscoveryAdminItem> => {
    const db = getDb()
    const [existing] = await db.select({ id: homeDiscoveryItems.id })
      .from(homeDiscoveryItems)
      .where(eq(homeDiscoveryItems.itemKey, input.itemKey))
      .limit(1)

    if (existing) {
      throw createError({ statusCode: 409, statusMessage: 'Item key already exists' })
    }

    const [{ maxOrder }] = await db.select({
      maxOrder: sql<number>`coalesce(max(${homeDiscoveryItems.sortOrder}), -1)::int`,
    })
      .from(homeDiscoveryItems)
      .where(eq(homeDiscoveryItems.groupId, input.groupId))

    const [row] = await db.insert(homeDiscoveryItems).values({
      itemKey: input.itemKey,
      groupId: input.groupId,
      labelRu: input.labelRu,
      labelEn: input.labelEn,
      icon: input.icon,
      tone: input.tone,
      params: input.params,
      sortOrder: (maxOrder ?? -1) + 1,
      active: true,
    }).returning()

    return mapRowToAdminItem(row)
  },

  deleteItem: async (id: string) => {
    const db = getDb()
    const [row] = await db.delete(homeDiscoveryItems).where(eq(homeDiscoveryItems.id, id)).returning({ id: homeDiscoveryItems.id })

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Discovery item not found' })
    }

    return { deleted: true as const }
  },

  moveItem: async (id: string, direction: 'up' | 'down'): Promise<HomeDiscoveryAdminGroup[]> => {
    const db = getDb()
    const [item] = await db.select().from(homeDiscoveryItems).where(eq(homeDiscoveryItems.id, id)).limit(1)

    if (!item) {
      throw createError({ statusCode: 404, statusMessage: 'Discovery item not found' })
    }

    const siblings = await db.select().from(homeDiscoveryItems)
      .where(eq(homeDiscoveryItems.groupId, item.groupId))
      .orderBy(asc(homeDiscoveryItems.sortOrder), asc(homeDiscoveryItems.itemKey))

    const index = siblings.findIndex(row => row.id === id)
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) {
      return homeDiscoveryService.listAdminGroups()
    }

    const current = siblings[index]!
    const target = siblings[targetIndex]!

    await db.update(homeDiscoveryItems)
      .set({ sortOrder: target.sortOrder })
      .where(eq(homeDiscoveryItems.id, current.id))

    await db.update(homeDiscoveryItems)
      .set({ sortOrder: current.sortOrder })
      .where(eq(homeDiscoveryItems.id, target.id))

    return homeDiscoveryService.listAdminGroups()
  },

  uploadImage: async (id: string, file: { data: Buffer, filename?: string, type?: string }) => {
    const db = getDb()
    const imageUrl = await saveHomeDiscoveryImage(id, file)

    const [row] = await db.update(homeDiscoveryItems)
      .set({ imageUrl })
      .where(eq(homeDiscoveryItems.id, id))
      .returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Discovery item not found' })
    }

    return mapRowToAdminItem(row)
  },

  clearImage: async (id: string) => {
    const db = getDb()
    const [row] = await db.update(homeDiscoveryItems)
      .set({ imageUrl: null })
      .where(eq(homeDiscoveryItems.id, id))
      .returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Discovery item not found' })
    }

    return mapRowToAdminItem(row)
  },

  updateItem: async (id: string, input: UpdateHomeDiscoveryItemInput) => {
    const db = getDb()
    const patch: Partial<typeof homeDiscoveryItems.$inferInsert> = {}

    if (input.icon !== undefined) {
      patch.icon = input.icon
    }

    if (input.tone !== undefined) {
      patch.tone = input.tone
    }

    if (input.labelRu !== undefined) {
      patch.labelRu = input.labelRu
    }

    if (input.labelEn !== undefined) {
      patch.labelEn = input.labelEn
    }

    if (input.active !== undefined) {
      patch.active = input.active
    }

    if (input.sortOrder !== undefined) {
      patch.sortOrder = input.sortOrder
    }

    if (input.params !== undefined) {
      patch.params = input.params
    }

    if (input.imageUrl !== undefined) {
      patch.imageUrl = input.imageUrl
    }

    const [row] = await db.update(homeDiscoveryItems).set(patch).where(eq(homeDiscoveryItems.id, id)).returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Discovery item not found' })
    }

    return mapRowToAdminItem(row)
  },
}
