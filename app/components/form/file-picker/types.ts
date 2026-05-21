export interface FormFilePickerProps {
  modelValue: File[]
  label?: string
  hint?: string
  accept?: string
  maxFiles?: number
  disabled?: boolean
  id?: string
}

export interface FormFilePickerEmits {
  'update:modelValue': [value: File[]]
}
