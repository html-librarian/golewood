import type { ListingCard } from '#shared/types/listing'
import { authorizationHeaders } from '#shared/utils/auth-headers'

export const useFavorites = () => {
  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const fetchFavorites = () =>
    $fetch<ListingCard[]>('/api/favorites', { headers: authHeaders() })

  const fetchFavoriteIds = () =>
    $fetch<{ ids: string[] }>('/api/favorites/ids', { headers: authHeaders() })

  const addFavorite = (listingId: string) =>
    $fetch('/api/favorites/' + listingId, {
      method: 'POST',
      headers: authHeaders(),
    })

  const removeFavorite = (listingId: string) =>
    $fetch('/api/favorites/' + listingId, {
      method: 'DELETE',
      headers: authHeaders(),
    })

  return {
    fetchFavorites,
    fetchFavoriteIds,
    addFavorite,
    removeFavorite,
  }
}
