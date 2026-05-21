import { extname } from 'node:path'
import type { StoryMediaType } from '#shared/types/story'

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v'])

export const resolveStoryMediaType = (filename?: string, mime?: string): StoryMediaType => {
  if (mime?.startsWith('video/')) {
    return 'video'
  }

  const ext = extname(filename ?? '').toLowerCase()

  if (VIDEO_EXTENSIONS.has(ext)) {
    return 'video'
  }

  return 'image'
}
