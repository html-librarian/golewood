export interface FormTextareaProps {
  modelValue: string
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  rows?: number
  id?: string
  required?: boolean
}

export interface FormTextareaEmits {
  'update:modelValue': [value: string]
}
