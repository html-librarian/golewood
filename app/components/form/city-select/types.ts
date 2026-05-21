import type { CatalogCountryCode } from '#shared/catalog/countries'

export interface FormCitySelectProps {
  modelValue: string
  label?: string
  error?: string
  id?: string
  disabled?: boolean
  placeholder?: string
  variant?: 'default' | 'plain'
  /** Подсказка под полем (например, город по геолокации) */
  hint?: string
  /** Показывать кнопку сброса при выбранном городе */
  clearable?: boolean
  /** ISO 3166-1 alpha-2; по умолчанию Россия */
  countryCode?: CatalogCountryCode
  required?: boolean
}

export interface FormCitySelectEmits {
  'update:modelValue': [value: string]
}
