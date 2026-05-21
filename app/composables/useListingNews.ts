import type { ListingNewsItem, ListingNewsMedia, ListingNewsReaction } from '#shared/types/listing-news'
import type { CreateListingNewsInput, UpdateListingNewsInput } from '#shared/schemas/listing-news'

export const useListingNews = () => {
  const { fetchMe, authHeaders } = useAuth()

  const fetchListingNews = (listingId: string) =>
    $fetch<ListingNewsItem[]>(`/api/listings/${listingId}/news`)

  const fetchNewsDetail = (listingId: string, newsId: string) =>
    $fetch<ListingNewsItem>(`/api/listings/${listingId}/news/${newsId}`)

  const fetchHostNews = async (listingId: string) => {
    await fetchMe()
    return $fetch<ListingNewsItem[]>(`/api/host/listings/${listingId}/news`, {
      headers: authHeaders.value,
    })
  }

  const createNews = async (listingId: string, input: CreateListingNewsInput) => {
    await fetchMe()
    return $fetch<ListingNewsItem>(`/api/host/listings/${listingId}/news`, {
      method: 'POST',
      headers: authHeaders.value,
      body: input,
    })
  }

  const updateNews = async (listingId: string, newsId: string, input: UpdateListingNewsInput) => {
    await fetchMe()
    return $fetch<ListingNewsItem>(`/api/host/listings/${listingId}/news/${newsId}`, {
      method: 'PATCH',
      headers: authHeaders.value,
      body: input,
    })
  }

  const deleteNews = async (listingId: string, newsId: string) =>
    $fetch(`/api/host/listings/${listingId}/news/${newsId}`, {
      method: 'DELETE',
      headers: authHeaders.value,
    })

  const uploadPreview = async (listingId: string, newsId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return $fetch<ListingNewsItem>(`/api/host/listings/${listingId}/news/${newsId}/preview`, {
      method: 'POST',
      headers: authHeaders.value,
      body: formData,
    })
  }

  const uploadMedia = async (listingId: string, newsId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return $fetch<ListingNewsMedia>(`/api/host/listings/${listingId}/news/${newsId}/media`, {
      method: 'POST',
      headers: authHeaders.value,
      body: formData,
    })
  }

  const addMediaEmbed = async (listingId: string, newsId: string, embedUrl: string) => {
    const formData = new FormData()
    formData.append('embedUrl', embedUrl)

    return $fetch<ListingNewsMedia>(`/api/host/listings/${listingId}/news/${newsId}/media`, {
      method: 'POST',
      headers: authHeaders.value,
      body: formData,
    })
  }

  const removeMedia = async (listingId: string, newsId: string, mediaId: string) =>
    $fetch(`/api/host/listings/${listingId}/news/${newsId}/media/${mediaId}`, {
      method: 'DELETE',
      headers: authHeaders.value,
    })

  const setReaction = async (listingId: string, newsId: string, reaction: ListingNewsReaction) => {
    await fetchMe()
    return $fetch<{ likesCount: number, dislikesCount: number, userReaction: ListingNewsReaction | null }>(
      `/api/listings/${listingId}/news/${newsId}/reactions`,
      {
        method: 'POST',
        headers: authHeaders.value,
        body: { reaction },
      },
    )
  }

  return {
    fetchListingNews,
    fetchNewsDetail,
    fetchHostNews,
    createNews,
    updateNews,
    deleteNews,
    uploadPreview,
    uploadMedia,
    addMediaEmbed,
    removeMedia,
    setReaction,
  }
}
