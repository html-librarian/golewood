export interface SearchBarProps {
  city: string
  checkIn: string
  checkOut: string
  guests: string
  loading?: boolean
  variant?: 'default' | 'hero' | 'toolbar'
  /** Подсказка, что город подставлен автоматически */
  cityHint?: string
}

export interface SearchBarEmits {
  'update:city': [value: string]
  'update:checkIn': [value: string]
  'update:checkOut': [value: string]
  'update:guests': [value: string]
  submit: []
}
