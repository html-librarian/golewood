export interface FormDateRangeProps {
  start: string
  end: string
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  minDate?: string
  id?: string
  variant?: 'default' | 'plain'
}

export interface FormDateRangeEmits {
  'update:start': [value: string]
  'update:end': [value: string]
}
