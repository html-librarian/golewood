import type { CreateReviewInput } from '#shared/schemas/review'
import type { CreateReviewReplyInput } from '#shared/schemas/review-reply'
import type {
  HostListingReviewsResponse,
  ListingReviewsResponse,
  Review,
  ReviewEligibility,
  ReviewPhoto,
  ReviewReply,
} from '#shared/types/review'

export const useReviews = () => {
  const { authHeaders } = useAuth()

  const fetchListingReviews = (listingId: string) =>
    $fetch<ListingReviewsResponse>(`/api/listings/${listingId}/reviews`)

  const fetchReviewEligibility = (listingId: string, bookingId?: string) =>
    $fetch<ReviewEligibility>(`/api/listings/${listingId}/review-eligibility`, {
      headers: authHeaders.value,
      query: bookingId ? { bookingId } : undefined,
    })

  const createReview = async (bookingId: string, input: CreateReviewInput) => {
    const requestInit: RequestInit = {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders.value,
      },
      body: JSON.stringify({ bookingId, ...input }),
    }

    let response = await fetch('/api/submit-review', requestInit)

    if (response.status === 400 && !(await response.clone().text())) {
      await new Promise(resolve => setTimeout(resolve, 100))
      response = await fetch('/api/submit-review', requestInit)
    }

    if (!response.ok) {
      throw new Error(await response.text().catch(() => `Review request failed (${response.status})`))
    }

    return response.json() as Promise<Review>
  }

  const fetchHostListingReviews = (listingId: string) =>
    $fetch<HostListingReviewsResponse>(`/api/host/listings/${listingId}/reviews`, {
      headers: authHeaders.value,
    })

  const createReviewReply = (reviewId: string, input: CreateReviewReplyInput) =>
    $fetch<ReviewReply>(`/api/reviews/${reviewId}/replies`, {
      method: 'POST',
      headers: authHeaders.value,
      body: input,
    })

  const uploadReviewPhoto = async (reviewId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return $fetch<ReviewPhoto>(`/api/reviews/${reviewId}/photos`, {
      method: 'POST',
      headers: authHeaders.value,
      body: formData,
    })
  }

  return {
    fetchListingReviews,
    fetchHostListingReviews,
    fetchReviewEligibility,
    createReview,
    createReviewReply,
    uploadReviewPhoto,
  }
}
