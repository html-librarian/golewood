import type { CreateCalendarFeedInput, CreateGoogleCalendarFeedInput } from '#shared/schemas/calendar-sync'
import type { ListingCalendarFeed, ListingCalendarSyncState } from '#shared/types/calendar-sync'
import { buildIcalCalendar, parseIcalEvents } from '#shared/utils/ical'
import { formatDate } from '#shared/utils/dates'
import { and, eq, inArray } from 'drizzle-orm'
import { getRedis } from '../utils/redis'
import { randomUUID } from 'node:crypto'
import { bookings, listingBlocks, listingCalendarFeeds, listings } from '../db/schema'
import { getDb } from '../utils/db'
import { calendarService } from './calendar.service'
import { googleCalendarService } from './google-calendar.service'

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'] as const
const MAX_FEED_BYTES = 2 * 1024 * 1024
const FETCH_TIMEOUT_MS = 15_000

const mapFeed = (row: typeof listingCalendarFeeds.$inferSelect): ListingCalendarFeed => ({
  id: row.id,
  listingId: row.listingId,
  label: row.label,
  feedUrl: row.feedUrl,
  feedType: row.feedType === 'google' ? 'google' : 'ical',
  googleCalendarId: row.googleCalendarId ?? null,
  active: row.active,
  lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
  lastSyncError: row.lastSyncError,
  createdAt: row.createdAt.toISOString(),
})

const importEventsToFeed = async (
  listingId: string,
  hostId: string,
  feedId: string,
  events: Array<{ uid: string, startDate: string, endDate: string }>,
) => {
  const db = getDb()

  await db.delete(listingBlocks).where(and(
    eq(listingBlocks.listingId, listingId),
    eq(listingBlocks.feedId, feedId),
    eq(listingBlocks.source, 'import'),
  ))

  let imported = 0
  let skipped = 0

  for (const event of events) {
    try {
      await calendarService.addBlock(listingId, hostId, event.startDate, event.endDate, {
        source: 'import',
        feedId,
        externalUid: `${feedId}:${event.uid}`,
      })
      imported += 1
    } catch {
      skipped += 1
    }
  }

  return { imported, skipped }
}

const assertHostOwnsListing = async (listingId: string, hostId: string) => {
  const db = getDb()
  const [listing] = await db.select({
    id: listings.id,
    hostId: listings.hostId,
    title: listings.title,
    calendarExportToken: listings.calendarExportToken,
  })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1)

  if (!listing || listing.hostId !== hostId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return listing
}

const assertSafeFeedUrl = (feedUrl: string) => {
  let parsed: URL

  try {
    parsed = new URL(feedUrl)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid calendar URL' })
  }

  if (parsed.protocol !== 'https:') {
    throw createError({ statusCode: 400, statusMessage: 'Calendar URL must use HTTPS' })
  }

  const host = parsed.hostname.toLowerCase()

  if (
    host === 'localhost'
    || host.endsWith('.local')
    || host === '127.0.0.1'
    || host.startsWith('10.')
    || host.startsWith('192.168.')
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Calendar URL host is not allowed' })
  }
}

const fetchFeedText = async (feedUrl: string) => {
  assertSafeFeedUrl(feedUrl)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { Accept: 'text/calendar, text/plain, */*' },
    })

    if (!response.ok) {
      throw createError({ statusCode: 400, statusMessage: `Calendar feed returned ${response.status}` })
    }

    const buffer = await response.arrayBuffer()

    if (buffer.byteLength > MAX_FEED_BYTES) {
      throw createError({ statusCode: 400, statusMessage: 'Calendar feed is too large' })
    }

    return new TextDecoder('utf-8').decode(buffer)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw createError({ statusCode: 408, statusMessage: 'Calendar feed request timed out' })
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export const calendarSyncService = {
  getSyncState: async (listingId: string, hostId: string): Promise<ListingCalendarSyncState> => {
    const listing = await assertHostOwnsListing(listingId, hostId)
    const config = useRuntimeConfig()
    const siteUrl = (config.public.siteUrl as string)?.replace(/\/$/, '') || 'http://localhost:3000'

    const db = getDb()
    const feeds = await db.select()
      .from(listingCalendarFeeds)
      .where(eq(listingCalendarFeeds.listingId, listingId))
      .orderBy(listingCalendarFeeds.createdAt)

    return {
      exportUrl: `${siteUrl}/api/calendar/export/${listing.calendarExportToken}`,
      feeds: feeds.map(mapFeed),
    }
  },

  addFeed: async (listingId: string, hostId: string, input: CreateCalendarFeedInput) => {
    await assertHostOwnsListing(listingId, hostId)
    assertSafeFeedUrl(input.feedUrl)

    const db = getDb()
    const [row] = await db.insert(listingCalendarFeeds).values({
      listingId,
      label: input.label,
      feedUrl: input.feedUrl,
    }).returning()

    return mapFeed(row)
  },

  addGoogleFeed: async (
    listingId: string,
    hostId: string,
    input: CreateGoogleCalendarFeedInput,
  ) => {
    await assertHostOwnsListing(listingId, hostId)

    const status = await googleCalendarService.getConnectionStatus(hostId)

    if (!status.connected) {
      throw createError({ statusCode: 400, statusMessage: 'Connect Google Calendar first' })
    }

    const db = getDb()
    const feedUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(input.googleCalendarId)}`
    const [row] = await db.insert(listingCalendarFeeds).values({
      listingId,
      label: input.label,
      feedUrl,
      feedType: 'google',
      googleCalendarId: input.googleCalendarId,
    }).returning()

    return mapFeed(row)
  },

  removeFeed: async (listingId: string, hostId: string, feedId: string) => {
    await assertHostOwnsListing(listingId, hostId)
    const db = getDb()

    const [removed] = await db.delete(listingCalendarFeeds)
      .where(and(
        eq(listingCalendarFeeds.id, feedId),
        eq(listingCalendarFeeds.listingId, listingId),
      ))
      .returning()

    if (!removed) {
      throw createError({ statusCode: 404, statusMessage: 'Feed not found' })
    }

    return { ok: true }
  },

  syncFeed: async (listingId: string, hostId: string, feedId: string) => {
    await assertHostOwnsListing(listingId, hostId)
    const db = getDb()

    const [feed] = await db.select()
      .from(listingCalendarFeeds)
      .where(and(
        eq(listingCalendarFeeds.id, feedId),
        eq(listingCalendarFeeds.listingId, listingId),
      ))
      .limit(1)

    if (!feed) {
      throw createError({ statusCode: 404, statusMessage: 'Feed not found' })
    }

    try {
      const events = feed.feedType === 'google' && feed.googleCalendarId
        ? await googleCalendarService.fetchEvents(hostId, feed.googleCalendarId)
        : parseIcalEvents(await fetchFeedText(feed.feedUrl))

      const { imported, skipped } = await importEventsToFeed(listingId, hostId, feedId, events)

      await db.update(listingCalendarFeeds)
        .set({
          lastSyncedAt: new Date(),
          lastSyncError: skipped > 0 ? `Imported ${imported}, skipped ${skipped} (overlap or conflict)` : '',
        })
        .where(eq(listingCalendarFeeds.id, feedId))

      return { imported, skipped }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed'

      await db.update(listingCalendarFeeds)
        .set({ lastSyncError: message })
        .where(eq(listingCalendarFeeds.id, feedId))

      throw error
    }
  },

  runCronSync: async () => {
    const config = useRuntimeConfig()

    if (String(config.calendarSyncCronEnabled) === 'false') {
      return { skipped: true, reason: 'disabled' }
    }

    const redis = getRedis()
    const lockKey = 'cron:calendar-sync'
    const acquired = await redis.set(lockKey, '1', 'EX', 3600, 'NX')

    if (acquired !== 'OK') {
      return { skipped: true, reason: 'lock' }
    }

    const db = getDb()
    const rows = await db.select({
      feedId: listingCalendarFeeds.id,
      listingId: listingCalendarFeeds.listingId,
      hostId: listings.hostId,
    })
      .from(listingCalendarFeeds)
      .innerJoin(listings, eq(listingCalendarFeeds.listingId, listings.id))
      .where(and(
        eq(listingCalendarFeeds.active, true),
        inArray(listings.status, ['published', 'draft', 'moderation']),
      ))

    const results: Array<{
      feedId: string
      listingId: string
      imported?: number
      skipped?: number
      error?: string
    }> = []

    for (const row of rows) {
      try {
        const outcome = await calendarSyncService.syncFeed(row.listingId, row.hostId, row.feedId)
        results.push({ feedId: row.feedId, listingId: row.listingId, ...outcome })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sync failed'
        results.push({ feedId: row.feedId, listingId: row.listingId, error: message })
      }
    }

    const failed = results.filter(item => item.error).length

    return {
      feeds: rows.length,
      failed,
      results,
    }
  },

  syncAllFeeds: async (listingId: string, hostId: string) => {
    const { feeds } = await calendarSyncService.getSyncState(listingId, hostId)
    const results = []

    for (const feed of feeds.filter(item => item.active)) {
      results.push({
        feedId: feed.id,
        ...(await calendarSyncService.syncFeed(listingId, hostId, feed.id)),
      })
    }

    return results
  },

  rotateExportToken: async (listingId: string, hostId: string) => {
    await assertHostOwnsListing(listingId, hostId)
    const db = getDb()
    const token = randomUUID()

    await db.update(listings)
      .set({ calendarExportToken: token })
      .where(eq(listings.id, listingId))

    return calendarSyncService.getSyncState(listingId, hostId)
  },

  exportByToken: async (token: string) => {
    const db = getDb()
    const [listing] = await db.select({ id: listings.id, title: listings.title })
      .from(listings)
      .where(eq(listings.calendarExportToken, token))
      .limit(1)

    if (!listing) {
      throw createError({ statusCode: 404, statusMessage: 'Calendar not found' })
    }

    const blocks = await db.select().from(listingBlocks)
      .where(eq(listingBlocks.listingId, listing.id))

    const activeBookings = await db.select({
      id: bookings.id,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      status: bookings.status,
    })
      .from(bookings)
      .where(and(
        eq(bookings.listingId, listing.id),
        inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
      ))

    const events = [
      ...blocks.map(block => ({
        uid: `golewood-block-${block.id}@golewood.ru`,
        startDate: formatDate(block.startDate),
        endDate: formatDate(block.endDate),
        summary: block.source === 'import' ? `Blocked (import) — ${listing.title}` : `Blocked — ${listing.title}`,
      })),
      ...activeBookings.map(booking => ({
        uid: `golewood-booking-${booking.id}@golewood.ru`,
        startDate: formatDate(booking.checkIn),
        endDate: formatDate(booking.checkOut),
        summary: `Booking (${booking.status}) — ${listing.title}`,
      })),
    ]

    return buildIcalCalendar(events)
  },
}
