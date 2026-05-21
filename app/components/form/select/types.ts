export interface FormSelectOption {
  value: string
  label: string
}

export interface FormSelectProps {
  modelValue: string
  options: FormSelectOption[]
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  id?: string
  variant?: 'default' | 'plain'
  required?: boolean
}

export interface FormSelectEmits {
  'update:modelValue': [value: string]
}
