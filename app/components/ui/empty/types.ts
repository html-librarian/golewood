export interface UiEmptyProps {
  icon?: string
  title: string
  description?: string
  /** Внутри surface-card — без второй рамки */
  embedded?: boolean
  /** Внутри секции — только разделитель и текст, без карточки */
  inline?: boolean
  /** Фирменный empty с деревом Golewood */
  brand?: boolean
}
