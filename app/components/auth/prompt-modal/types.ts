export interface AuthPromptModalProps {
  open: boolean
  title: string
  description?: string
}

export interface AuthPromptModalEmits {
  'update:open': [value: boolean]
  success: []
}
