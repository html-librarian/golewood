export interface ReviewReplyFormProps {
  reviewId: string
  parentReplyId?: string | null
  placeholder: string
  submitLabel: string
}

export interface ReviewReplyFormEmits {
  submitted: []
}
