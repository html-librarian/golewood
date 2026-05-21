import { describe, expect, it } from 'vitest'
import { resolveStoryMediaType } from './story-media'

describe('resolveStoryMediaType', () => {
  it('detects video by mime', () => {
    expect(resolveStoryMediaType('clip.mp4', 'video/mp4')).toBe('video')
  })

  it('detects video by extension', () => {
    expect(resolveStoryMediaType('clip.webm')).toBe('video')
  })

  it('defaults to image', () => {
    expect(resolveStoryMediaType('photo.jpg', 'image/jpeg')).toBe('image')
  })
})
