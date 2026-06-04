export interface UiSectionProps {
  id?: string
  title?: string
  icon?: string
  scrollMargin?: boolean
  /** card — белая карточка; plain — только заголовок и контент */
  variant?: 'card' | 'plain'
}
