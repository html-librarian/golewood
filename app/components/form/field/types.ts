export interface FormFieldProps {
  label?: string
  error?: string
  id?: string
  variant?: 'default' | 'plain'
  /** Shows a red asterisk on the label for required fields. */
  required?: boolean
}
