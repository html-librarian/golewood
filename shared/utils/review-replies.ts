import type { ReviewReply } from '#shared/types/review'

export const buildReviewReplyTree = (flat: ReviewReply[]): ReviewReply[] => {
  const byParent = new Map<string | null, ReviewReply[]>()

  for (const reply of flat) {
    const key = reply.parentReplyId
    const bucket = byParent.get(key) ?? []
    bucket.push({ ...reply, children: [] })
    byParent.set(key, bucket)
  }

  const attach = (parentId: string | null): ReviewReply[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(reply => ({
        ...reply,
        children: attach(reply.id),
      }))

  return attach(null)
}
