import type { ReviewPublic } from '#shared/types/review'
import type { ReviewReplyThreadLabels } from '../reply-thread/types'

export interface ReviewCardProps {
  review: ReviewPublic
  replyLabels?: ReviewReplyThreadLabels
  canReplyToReview?: boolean
  canReplyToReply?: (reply: import('#shared/types/review').ReviewReply) => boolean
  showPendingBadge?: boolean
  pending?: boolean
}

export interface ReviewCardEmits {
  refresh: []
}
