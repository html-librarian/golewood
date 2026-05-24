import type { HomeDiscoveryFilter, HomeDiscoveryGroup } from '#shared/catalog/home-discovery'
import { HOME_DISCOVERY_GROUPS } from '#shared/catalog/home-discovery'
import type { HomeDiscoveryAdminGroup, HomeDiscoveryParams } from '#shared/types/home-discovery-admin'
import type { UpdateHomeDiscoveryItemInput } from '#shared/schemas/home-discovery'
import { asc, eq } from 'drizzle-orm'
import { homeDiscoveryGroups, homeDiscoveryItems } from '../db/schema'
import { getDb } from '../utils/db'

const mapParams = (raw: Record<string, unknown>): HomeDiscoveryParams => {
  const params: HomeDiscoveryParams = {}

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

const mapItemToFilter = (
  row: typeof homeDiscoveryItems.$inferSelect,
): HomeDiscoveryFilter => ({
  id: row.itemKey,
  labelRu: row.labelRu,
  labelEn: row.labelEn,
  icon: row.icon,
  tone: row.tone,
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
      .orderBy(asc(homeDiscoveryItems.sortOrder), asc(homeDiscoveryItems.labelRu))

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
      items: (itemsByGroup.get(group.id) ?? []).map(row => ({
        id: row.id,
        itemKey: row.itemKey,
        groupId: row.groupId,
        labelRu: row.labelRu,
        labelEn: row.labelEn,
        icon: row.icon,
        tone: row.tone,
        params: mapParams(row.params as Record<string, unknown>),
        active: row.active,
        sortOrder: row.sortOrder,
      })),
    }))
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

    const [row] = await db.update(homeDiscoveryItems).set(patch).where(eq(homeDiscoveryItems.id, id)).returning()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Discovery item not found' })
    }

    return {
      id: row.id,
      itemKey: row.itemKey,
      groupId: row.groupId,
      labelRu: row.labelRu,
      labelEn: row.labelEn,
      icon: row.icon,
      tone: row.tone,
      params: mapParams(row.params as Record<string, unknown>),
      active: row.active,
      sortOrder: row.sortOrder,
    }
  },
}
