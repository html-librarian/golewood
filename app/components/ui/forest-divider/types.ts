export type UiForestDividerTone = 'sand' | 'white' | 'forest'

export interface UiForestDividerProps {
  /** flip for dark-on-light → light-on-dark transitions */
  flip?: boolean
  /** Fill color of the wave — matches the section below */
  tone?: UiForestDividerTone
}
