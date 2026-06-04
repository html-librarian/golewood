export interface BlogFollowButtonProps {
  authorId: string
  initialFollowing?: boolean
  size?: 'sm' | 'md'
}

export interface BlogFollowButtonEmits {
  update: [following: boolean]
}
