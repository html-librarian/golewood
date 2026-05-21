import { describe, expect, it } from 'vitest'
import { buildReviewReplyTree } from './review-replies'
import type { ReviewReply } from '#shared/types/review'

const base = (overrides: Partial<ReviewReply> & Pick<ReviewReply, 'id' | 'parentReplyId' | 'createdAt'>): ReviewReply => ({
  reviewId: 'r1',
  authorId: 'u1',
  authorRole: 'host',
  authorName: 'Host',
  text: 'text',
  children: [],
  ...overrides,
})

describe('buildReviewReplyTree', () => {
  it('nests replies under parent', () => {
    const tree = buildReviewReplyTree([
      base({ id: '1', parentReplyId: null, createdAt: '2026-01-01T10:00:00Z', authorRole: 'host' }),
      base({ id: '2', parentReplyId: '1', createdAt: '2026-01-02T10:00:00Z', authorRole: 'guest', authorName: 'Guest' }),
    ])

    expect(tree).toHaveLength(1)
    expect(tree[0]?.children).toHaveLength(1)
    expect(tree[0]?.children[0]?.id).toBe('2')
  })
})
