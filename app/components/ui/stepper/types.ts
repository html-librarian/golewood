export interface UiStepperItem {
  label: string
}

export interface UiStepperProps {
  steps: UiStepperItem[]
  current: number
  /** When true, enabled steps are clickable (use with isStepEnabled). */
  clickable?: boolean
  isStepEnabled?: (step: number) => boolean
}

export interface UiStepperEmits {
  select: [step: number]
}
