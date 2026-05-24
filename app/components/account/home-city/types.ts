export interface AccountHomeCityProps {
  initialCity?: string | null
  label: string
  hint?: string
  saveLabel: string
  savedLabel: string
  errorSave: string
}

export interface AccountHomeCityEmits {
  saved: [city: string | null]
}
