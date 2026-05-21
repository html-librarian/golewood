export const SPOTLIGHT_PHOTO_STATUSES = ['pending', 'approved', 'rejected'] as const
export type SpotlightPhotoStatus = typeof SPOTLIGHT_PHOTO_STATUSES[number]

export interface SpotlightPhoto {
  id: string
  userId: string
  listingId: string
  imageUrl: string
  caption: string
  status: SpotlightPhotoStatus
  monthKey: string
  voteCount: number
  createdAt: string
  listingTitle?: string
  listingCity?: string
  authorName?: string | null
  userVoted?: boolean
}

export interface SpotlightHero {
  monthKey: string | null
  imageUrl: string | null
  caption: string | null
  listingTitle: string | null
  listingCity: string | null
  authorName: string | null
}

export interface SpotlightVoteState {
  monthKey: string
  photoId: string | null
  closed: boolean
}
