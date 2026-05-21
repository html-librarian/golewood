export const BLOCK_SOURCES = ['manual', 'import'] as const
export type BlockSource = typeof BLOCK_SOURCES[number]

export const CALENDAR_FEED_TYPES = ['ical', 'google'] as const
export type CalendarFeedType = typeof CALENDAR_FEED_TYPES[number]

export interface ListingCalendarFeed {
  id: string
  listingId: string
  label: string
  feedUrl: string
  feedType: CalendarFeedType
  googleCalendarId: string | null
  active: boolean
  lastSyncedAt: string | null
  lastSyncError: string
  createdAt: string
}

export interface ListingCalendarSyncState {
  exportUrl: string
  feeds: ListingCalendarFeed[]
}
