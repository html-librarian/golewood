export interface FormCheckboxProps {
  modelValue: boolean
  label?: string
  disabled?: boolean
  id?: string
}

export interface FormCheckboxEmits {
  'update:modelValue': [value: boolean]
}
