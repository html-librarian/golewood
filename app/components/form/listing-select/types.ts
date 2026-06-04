import type { SearchResultItem } from '#shared/types/search'

export type FormListingSelectItem = Pick<
  SearchResultItem,
  'id' | 'title' | 'city' | 'address' | 'coverPhoto'
>

export interface FormListingSelectProps {
  modelValue: string
  label?: string
  error?: string
  id?: string
  disabled?: boolean
  required?: boolean
}

export interface FormListingSelectEmits {
  'update:modelValue': [value: string]
}
