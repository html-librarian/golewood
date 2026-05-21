import type { ReviewReply } from '#shared/types/review'

export interface ReviewReplyThreadLabels {
  host: string
  guest: string
  reply: string
  replyPlaceholder: string
  submit: string
}

export interface ReviewReplyThreadProps {
  reviewId: string
  replies: ReviewReply[]
  depth?: number
  labels: ReviewReplyThreadLabels
  canReplyToReview: boolean
  canReplyToReply: (reply: ReviewReply) => boolean
}

export interface ReviewReplyThreadEmits {
  refresh: []
}
