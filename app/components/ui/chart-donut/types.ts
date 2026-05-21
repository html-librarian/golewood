import type { ChartSegment } from '#shared/types/chart'

export interface UiChartDonutProps {
  title: string
  segments: ChartSegment[]
  totalLabel?: string
  emptyLabel?: string
}
