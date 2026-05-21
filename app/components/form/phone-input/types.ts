export interface FormPhoneInputProps {
  modelValue: string
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  id?: string
  required?: boolean
}

export interface FormPhoneInputEmits {
  'update:modelValue': [value: string]
}
