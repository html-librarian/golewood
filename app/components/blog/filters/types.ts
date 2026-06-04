import type { BlogSearchQuery } from '~/composables/useBlog'

export interface BlogFiltersProps {
  modelValue: BlogSearchQuery
}

export interface BlogFiltersEmits {
  'update:modelValue': [value: BlogSearchQuery]
  submit: []
}

export interface BlogAuthorOption {
  id: string
  label: string
}
