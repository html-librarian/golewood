import type { CalendarDay, CalendarUnavailableReason } from '#shared/types/booking'
import { formatLocalIsoDate } from '#shared/utils/calendar'
import { eachDay, formatDate, parseDate, rangesOverlap } from '#shared/utils/dates'
import { and, eq, inArray, lt, gt } from 'drizzle-orm'
import { bookings, listingBlocks, listingCalendarFeeds, listingPhotos, listings } from '../db/schema'
import { getDb } from '../utils/db'

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'] as const

const isDayBooked = (
  day: string,
  bookingRanges: Array<{ checkIn: Date, checkOut: Date }>,
) => bookingRanges.some(range => day >= formatDate(range.checkIn) && day < formatDate(range.checkOut))

const findManualBlockForDay = (
  day: string,
  blocks: Array<{ id: string, startDate: Date, endDate: Date, source: string }>,
) => blocks.find(block =>
  block.source === 'manual'
  && day >= formatDate(block.startDate)
  && day < formatDate(block.endDate),
)

const buildCalendarDays = (
  from: string,
  to: string,
  listing: { pricePerNight: number, minNights: number },
  blocks: Array<{ id: string, startDate: Date, endDate: Date, source: string }>,
  activeBookings: Array<{ checkIn: Date, checkOut: Date }>,
  options?: { includeHostMeta?: boolean },
): CalendarDay[] => {
  const todayIso = formatLocalIsoDate()

  return eachDay(from, to).map((date) => {
    const isPast = date < todayIso
    const manualBlock = findManualBlockForDay(date, blocks)
    const imported = blocks.some(block =>
      block.source === 'import'
      && date >= formatDate(block.startDate)
      && date < formatDate(block.endDate),
    )
    const booked = isDayBooked(date, activeBookings)
    const blocked = Boolean(manualBlock) || imported || booked

    let unavailableReason: CalendarUnavailableReason | null = null

    if (isPast) {
      unavailableReason = 'past'
    } else if (booked) {
      unavailableReason = 'booking'
    } else if (imported) {
      unavailableReason = 'import'
    } else if (manualBlock) {
      unavailableReason = 'manual'
    }

    return {
      date,
      available: !isPast && !blocked,
      price: listing.pricePerNight,
      minNights: listing.minNights,
      ...(options?.includeHostMeta
        ? {
            unavailableReason,
            manualBlockId: manualBlock?.id ?? null,
          }
        : {}),
    }
  })
}

export const calendarService = {
  getAvailability: async (listingId: string, from: string, to: string): Promise<CalendarDay[]> => {
    const db = getDb()
    const [listing] = await db.select().from(listings)
      .where(and(eq(listings.id, listingId), eq(listings.status, 'published')))
      .limit(1)

    if (!listing) {
      throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
    }

    const blocks = await db.select().from(listingBlocks).where(and(
      eq(listingBlocks.listingId, listingId),
      lt(listingBlocks.startDate, parseDate(to)),
      gt(listingBlocks.endDate, parseDate(from)),
    ))

    const activeBookings = await db.select({
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
    }).from(bookings).where(and(
      eq(bookings.listingId, listingId),
      inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
      lt(bookings.checkIn, parseDate(to)),
      gt(bookings.checkOut, parseDate(from)),
    ))

    return buildCalendarDays(from, to, listing, blocks, activeBookings)
  },

  getHostAvailability: async (
    listingId: string,
    hostId: string,
    from: string,
    to: string,
  ): Promise<CalendarDay[]> => {
    const db = getDb()
    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)

    if (!listing || listing.hostId !== hostId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const blocks = await db.select().from(listingBlocks).where(and(
      eq(listingBlocks.listingId, listingId),
      lt(listingBlocks.startDate, parseDate(to)),
      gt(listingBlocks.endDate, parseDate(from)),
    ))

    const activeBookings = await db.select({
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
    }).from(bookings).where(and(
      eq(bookings.listingId, listingId),
      inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
      lt(bookings.checkIn, parseDate(to)),
      gt(bookings.checkOut, parseDate(from)),
    ))

    return buildCalendarDays(from, to, listing, blocks, activeBookings, { includeHostMeta: true })
  },

  assertRangeAvailable: async (listingId: string, checkIn: string, checkOut: string) => {
    const from = checkIn
    const to = formatDate(new Date(parseDate(checkOut).getTime() - 24 * 60 * 60 * 1000))
    const days = await calendarService.getAvailability(listingId, from, to)
    const unavailable = days.find(day => !day.available)

    if (unavailable) {
      throw createError({ statusCode: 409, statusMessage: 'Selected dates are not available' })
    }

    const db = getDb()
    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)

    if (!listing) {
      throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
    }

    const nights = days.length

    if (nights < listing.minNights) {
      throw createError({
        statusCode: 400,
        statusMessage: `Minimum stay is ${listing.minNights} nights`,
      })
    }
  },

  addBlock: async (
    listingId: string,
    hostId: string,
    startDate: string,
    endDate: string,
    options?: { source?: 'manual' | 'import', feedId?: string, externalUid?: string },
  ) => {
    const db = getDb()
    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)

    if (!listing || listing.hostId !== hostId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const activeBookings = await db.select().from(bookings).where(and(
      eq(bookings.listingId, listingId),
      inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
    ))

    const overlapsBooking = activeBookings.some(booking =>
      rangesOverlap(startDate, endDate, formatDate(booking.checkIn), formatDate(booking.checkOut)),
    )

    if (overlapsBooking) {
      throw createError({ statusCode: 409, statusMessage: 'Block overlaps an active booking' })
    }

    await db.insert(listingBlocks).values({
      listingId,
      startDate: parseDate(startDate),
      endDate: parseDate(endDate),
      source: options?.source ?? 'manual',
      feedId: options?.feedId,
      externalUid: options?.externalUid,
    })
  },

  listBlocks: async (listingId: string, hostId: string) => {
    const db = getDb()
    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)

    if (!listing || listing.hostId !== hostId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const rows = await db.select({
      block: listingBlocks,
      feedLabel: listingCalendarFeeds.label,
    })
      .from(listingBlocks)
      .leftJoin(listingCalendarFeeds, eq(listingBlocks.feedId, listingCalendarFeeds.id))
      .where(eq(listingBlocks.listingId, listingId))
      .orderBy(listingBlocks.startDate)

    return rows.map(row => ({
      id: row.block.id,
      listingId: row.block.listingId,
      startDate: formatDate(row.block.startDate),
      endDate: formatDate(row.block.endDate),
      source: (row.block.source === 'import' ? 'import' : 'manual') as 'manual' | 'import',
      feedId: row.block.feedId,
      feedLabel: row.feedLabel,
      createdAt: row.block.createdAt.toISOString(),
    }))
  },

  removeBlock: async (listingId: string, blockId: string, hostId: string) => {
    const db = getDb()
    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)

    if (!listing || listing.hostId !== hostId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const [existing] = await db.select({ source: listingBlocks.source })
      .from(listingBlocks)
      .where(and(eq(listingBlocks.id, blockId), eq(listingBlocks.listingId, listingId)))
      .limit(1)

    if (existing?.source === 'import') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Imported blocks are managed via calendar sync. Remove the feed or run sync again.',
      })
    }

    const [removed] = await db.delete(listingBlocks)
      .where(and(eq(listingBlocks.id, blockId), eq(listingBlocks.listingId, listingId)))
      .returning()

    if (!removed) {
      throw createError({ statusCode: 404, statusMessage: 'Block not found' })
    }
  },
}

export const getListingCoverPhoto = async (listingId: string) => {
  const db = getDb()
  const [photo] = await db.select().from(listingPhotos)
    .where(eq(listingPhotos.listingId, listingId))
    .orderBy(listingPhotos.sortOrder)
    .limit(1)

  return photo?.url ?? null
}
