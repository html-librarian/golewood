import type { SearchSort } from '#shared/types/search'

export interface SearchSortProps {
  modelValue: SearchSort | ''
}

export interface SearchSortEmits {
  'update:modelValue': [value: SearchSort | '']
}
