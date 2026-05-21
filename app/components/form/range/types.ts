export interface FormRangeProps {
  minValue: string
  maxValue: string
  label?: string
  error?: string
  floor?: number
  ceiling?: number
  step?: number
  formatValue?: (value: number) => string
}

export interface FormRangeEmits {
  'update:minValue': [value: string]
  'update:maxValue': [value: string]
}
