import type { SpotlightPhoto } from '#shared/types/spotlight'

export interface SpotlightCardProps {
  photo: SpotlightPhoto
  voted?: boolean
  voteDisabled?: boolean
  loading?: boolean
}

export interface SpotlightCardEmits {
  vote: [photoId: string]
}
