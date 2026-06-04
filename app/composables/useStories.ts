import type { MyStoriesResponse, UserStory } from '#shared/types/story'
import { authorizationHeaders } from '#shared/utils/auth-headers'

export const useStories = () => {
  const { fetchMe } = useAuth()

  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const fetchListingStories = (listingId: string) =>
    $fetch<UserStory[]>(`/api/listings/${listingId}/stories`)

  const fetchMyStories = async () => {
    await fetchMe()
    return $fetch<MyStoriesResponse>('/api/stories/me', { headers: authHeaders() })
  }

  const fetchHostProfileStories = (hostId: string) =>
    $fetch<UserStory[]>(`/api/hosts/${hostId}/stories`)

  const uploadStory = async (listingId: string, file: File) => {
    await fetchMe()
    const formData = new FormData()
    formData.append('listingId', listingId)
    formData.append('file', file)

    return $fetch<UserStory>('/api/stories', {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    })
  }

  const fetchHostListingStories = async (listingId: string) => {
    await fetchMe()
    return $fetch<UserStory[]>(`/api/host/listings/${listingId}/stories`, {
      headers: authHeaders(),
    })
  }

  const pinStory = async (listingId: string, storyId: string) => {
    await fetchMe()
    return $fetch(`/api/host/listings/${listingId}/stories/${storyId}/pin`, {
      method: 'POST',
      headers: authHeaders(),
    })
  }

  const unpinStory = async (listingId: string, storyId: string) => {
    await fetchMe()
    return $fetch(`/api/host/listings/${listingId}/stories/${storyId}/pin`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  }

  const repostStoryToProfile = async (storyId: string) => {
    await fetchMe()
    return $fetch(`/api/host/stories/${storyId}/repost`, {
      method: 'POST',
      headers: authHeaders(),
    })
  }

  const unrepostStoryFromProfile = async (storyId: string) => {
    await fetchMe()
    return $fetch(`/api/host/stories/${storyId}/repost`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  }

  return {
    fetchListingStories,
    fetchMyStories,
    fetchHostProfileStories,
    uploadStory,
    fetchHostListingStories,
    pinStory,
    unpinStory,
    repostStoryToProfile,
    unrepostStoryFromProfile,
  }
}
