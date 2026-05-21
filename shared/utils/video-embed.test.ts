import { describe, expect, it } from 'vitest'
import { parseVideoEmbedUrl } from './video-embed'

describe('parseVideoEmbedUrl', () => {
  it('parses youtube watch url', () => {
    const result = parseVideoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(result?.provider).toBe('youtube')
    expect(result?.embedUrl).toContain('dQw4w9WgXcQ')
  })

  it('parses rutube url', () => {
    const result = parseVideoEmbedUrl('https://rutube.ru/video/abc123def456/')
    expect(result?.provider).toBe('rutube')
  })

  it('returns null for unknown host', () => {
    expect(parseVideoEmbedUrl('https://example.com/video')).toBeNull()
  })
})
