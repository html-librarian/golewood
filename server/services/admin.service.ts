import type { Listing } from '#shared/types/listing'
import { desc, eq } from 'drizzle-orm'
import { listingPhotos, listings } from '../db/schema'
import { getDb } from '../utils/db'
import { mapListing } from '../utils/listing-map'
import { adminDashboardService } from './admin-dashboard.service'

type AdminListingCard = Listing & {
  coverPhoto: { id: string, url: string, sortOrder: number } | null
}

const listListingsWithCover = async (status: 'moderation' | 'archived'): Promise<AdminListingCard[]> => {
  const db = getDb()
  const rows = await db.select().from(listings)
    .where(eq(listings.status, status))
    .orderBy(status === 'archived' ? desc(listings.updatedAt) : listings.updatedAt)

  const result: AdminListingCard[] = []

  for (const row of rows) {
    const photos = await db.select().from(listingPhotos)
      .where(eq(listingPhotos.listingId, row.id))

    result.push({
      ...mapListing(row),
      coverPhoto: photos[0]
        ? { id: photos[0].id, url: photos[0].url, sortOrder: photos[0].sortOrder }
        : null,
    })
  }

  return result
}

export const adminService = {
  getDashboard: () => adminDashboardService.getDashboard(),

  /** @deprecated Используйте getDashboard().queue */
  getStats: async () => {
    const dashboard = await adminDashboardService.getDashboard()
    return dashboard.queue
  },

  listModerationListings: () => listListingsWithCover('moderation'),

  listArchivedListings: () => listListingsWithCover('archived'),
}
