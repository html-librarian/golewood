import type { CreateListingInput, CreatePropertyListingInput, UpdateListingInput } from '#shared/schemas/listing'
import { authorizationHeaders } from '#shared/utils/auth-headers'
import type { CreateCalendarFeedInput, CreateGoogleCalendarFeedInput } from '#shared/schemas/calendar-sync'
import type { GoogleCalendarConnectionStatus, GoogleCalendarOption } from '#shared/types/google-calendar'
import type { CalendarDay, ListingBlock } from '#shared/types/booking'
import type { ListingCalendarSyncState } from '#shared/types/calendar-sync'
import type { ListingCard, ListingDetail, ListingDocument, ListingPhoto, ListingUnitCard } from '#shared/types/listing'

export const useListings = () => {
  const { fetchMe, isAuthenticated } = useAuth()

  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const fetchPublished = (city?: string) =>
    $fetch<ListingCard[]>('/api/listings', { query: city ? { city } : undefined })

  const fetchPublishedById = (id: string) =>
    $fetch<ListingDetail>(`/api/listings/${id}`)

  const fetchHostListings = async () => {
    await fetchMe()
    if (!isAuthenticated.value) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    return $fetch<ListingCard[]>('/api/host/listings', { headers: authHeaders() })
  }

  const createListing = async (input: CreateListingInput) =>
    $fetch<ListingDetail>('/api/host/listings', {
      method: 'POST',
      headers: authHeaders(),
      body: input,
    })

  const createProperty = async (input: CreatePropertyListingInput) =>
    $fetch<ListingDetail>('/api/host/properties', {
      method: 'POST',
      headers: authHeaders(),
      body: input,
    })

  const fetchPropertyForHost = async (propertyId: string) =>
    $fetch<ListingDetail & { units: ListingUnitCard[] }>(`/api/host/properties/${propertyId}`, {
      headers: authHeaders(),
    })

  const updateListing = async (id: string, input: UpdateListingInput) =>
    $fetch<ListingDetail>(`/api/host/listings/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: input,
    })

  const uploadPhoto = async (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return $fetch<ListingPhoto>(`/api/host/listings/${id}/photos`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    })
  }

  const deletePhoto = async (id: string, photoId: string) =>
    $fetch(`/api/host/listings/${id}/photos/${photoId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

  const reorderPhotos = async (id: string, photoIds: string[]) =>
    $fetch<ListingPhoto[]>(`/api/host/listings/${id}/photos/reorder`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: { photoIds },
    })

  const addVideo = async (id: string, url: string) =>
    $fetch<ListingPhoto>(`/api/host/listings/${id}/videos`, {
      method: 'POST',
      headers: authHeaders(),
      body: { url },
    })

  const uploadDocument = async (id: string, file: File, title: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)

    return $fetch<ListingDocument>(`/api/host/listings/${id}/documents`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    })
  }

  const deleteDocument = async (id: string, documentId: string) =>
    $fetch(`/api/host/listings/${id}/documents/${documentId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

  const submitListing = async (id: string) =>
    $fetch<ListingDetail>(`/api/host/listings/${id}/submit`, {
      method: 'POST',
      headers: authHeaders(),
    })

  const archiveListing = async (id: string) =>
    $fetch(`/api/host/listings/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

  const restoreListing = async (id: string) =>
    $fetch(`/api/host/listings/${id}/restore`, {
      method: 'POST',
      headers: authHeaders(),
    })

  const fetchHostListingById = (id: string) =>
    $fetch<ListingDetail>(`/api/host/listings/${id}`, { headers: authHeaders() })

  const fetchHostBlocks = (listingId: string) =>
    $fetch<ListingBlock[]>(`/api/host/listings/${listingId}/blocks`, { headers: authHeaders() })

  const fetchHostCalendar = (listingId: string, from: string, to: string) =>
    $fetch<CalendarDay[]>(
      `/api/host/listings/${listingId}/calendar`,
      { headers: authHeaders(), query: { from, to } },
    )

  const addHostBlock = (listingId: string, startDate: string, endDate: string) =>
    $fetch(`/api/host/listings/${listingId}/blocks`, {
      method: 'POST',
      headers: authHeaders(),
      body: { startDate, endDate },
    })

  const removeHostBlock = (listingId: string, blockId: string) =>
    $fetch(`/api/host/listings/${listingId}/blocks/${blockId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

  const fetchCalendarSync = (listingId: string) =>
    $fetch<ListingCalendarSyncState>(`/api/host/listings/${listingId}/calendar-sync`, {
      headers: authHeaders(),
    })

  const addCalendarFeed = (listingId: string, input: CreateCalendarFeedInput) =>
    $fetch(`/api/host/listings/${listingId}/calendar-sync/feeds`, {
      method: 'POST',
      headers: authHeaders(),
      body: input,
    })

  const removeCalendarFeed = (listingId: string, feedId: string) =>
    $fetch(`/api/host/listings/${listingId}/calendar-sync/feeds/${feedId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

  const syncCalendarFeed = (listingId: string, feedId: string) =>
    $fetch<{ imported: number, skipped: number }>(
      `/api/host/listings/${listingId}/calendar-sync/feeds/${feedId}/sync`,
      { method: 'POST', headers: authHeaders() },
    )

  const syncAllCalendarFeeds = (listingId: string) =>
    $fetch<Array<{ feedId: string, imported: number, skipped: number }>>(
      `/api/host/listings/${listingId}/calendar-sync/sync`,
      { method: 'POST', headers: authHeaders() },
    )

  const rotateCalendarExport = (listingId: string) =>
    $fetch<ListingCalendarSyncState>(`/api/host/listings/${listingId}/calendar-sync/rotate-export`, {
      method: 'POST',
      headers: authHeaders(),
    })

  const fetchGoogleCalendarStatus = () =>
    $fetch<GoogleCalendarConnectionStatus>('/api/host/google-calendar/status', {
      headers: authHeaders(),
    })

  const fetchGoogleCalendars = () =>
    $fetch<{ calendars: GoogleCalendarOption[] }>('/api/host/google-calendar/calendars', {
      headers: authHeaders(),
    })

  const addGoogleCalendarFeed = (listingId: string, input: CreateGoogleCalendarFeedInput) =>
    $fetch(`/api/host/listings/${listingId}/calendar-sync/google-feeds`, {
      method: 'POST',
      headers: authHeaders(),
      body: input,
    })

  const disconnectGoogleCalendar = () =>
    $fetch('/api/host/google-calendar/disconnect', {
      method: 'DELETE',
      headers: authHeaders(),
    })

  const attachListingsToProperty = (propertyId: string, listingIds: string[]) =>
    $fetch(`/api/host/properties/${propertyId}/attach`, {
      method: 'POST',
      headers: authHeaders(),
      body: { listingIds },
    })

  return {
    fetchPublished,
    fetchPublishedById,
    fetchHostListings,
    fetchHostListingById,
    fetchHostBlocks,
    fetchHostCalendar,
    addHostBlock,
    removeHostBlock,
    fetchCalendarSync,
    addCalendarFeed,
    removeCalendarFeed,
    syncCalendarFeed,
    syncAllCalendarFeeds,
    rotateCalendarExport,
    fetchGoogleCalendarStatus,
    fetchGoogleCalendars,
    addGoogleCalendarFeed,
    disconnectGoogleCalendar,
    createListing,
    createProperty,
    fetchPropertyForHost,
    attachListingsToProperty,
    updateListing,
    uploadPhoto,
    deletePhoto,
    reorderPhotos,
    addVideo,
    uploadDocument,
    deleteDocument,
    submitListing,
    archiveListing,
    restoreListing,
  }
}
