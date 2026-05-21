export interface FormRichTextProps {
  modelValue: string
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  id?: string
  minHeightClass?: string
  required?: boolean
}

export interface FormRichTextEmits {
  'update:modelValue': [value: string]
}
