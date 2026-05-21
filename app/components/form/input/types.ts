export interface FormInputProps {
  modelValue: string
  label?: string
  type?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  autocomplete?: string
  id?: string
  maxlength?: string | number
  variant?: 'default' | 'plain'
  required?: boolean
  testId?: string
}

export interface FormInputEmits {
  'update:modelValue': [value: string]
}
