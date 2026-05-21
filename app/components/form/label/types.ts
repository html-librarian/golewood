export interface FormLabelProps {
  required?: boolean
  /** Use `label` when the text is tied to a control via `for`. */
  as?: 'p' | 'label'
  fieldFor?: string
}
