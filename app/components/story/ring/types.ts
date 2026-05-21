import type { UserStory } from '#shared/types/story'

export interface StoryRingProps {
  stories: UserStory[]
  label?: string
}

export interface StoryRingEmits {
  open: [index: number]
}
