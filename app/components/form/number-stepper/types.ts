export interface FormNumberStepperProps {
  modelValue: string
  label?: string
  error?: string
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  id?: string
  variant?: 'default' | 'plain'
}

export interface FormNumberStepperEmits {
  'update:modelValue': [value: string]
}
