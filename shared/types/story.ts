export const STORY_MEDIA_TYPES = ['image', 'video'] as const
export type StoryMediaType = typeof STORY_MEDIA_TYPES[number]

export interface UserStory {
  id: string
  userId: string
  listingId: string
  mediaUrl: string
  mediaType: StoryMediaType
  expiresAt: string
  createdAt: string
  listingTitle?: string
  listingCity?: string
  authorName?: string | null
  pinned?: boolean
}
