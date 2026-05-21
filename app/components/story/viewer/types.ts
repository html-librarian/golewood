import type { UserStory } from '#shared/types/story'

export interface StoryViewerProps {
  stories: UserStory[]
  startIndex?: number
  open: boolean
}

export interface StoryViewerEmits {
  'update:open': [value: boolean]
}
