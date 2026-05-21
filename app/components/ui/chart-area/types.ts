import type { ChartSeriesPoint } from '#shared/types/chart'

export type UiChartAreaValueFormat = 'count' | 'price'

export interface UiChartAreaProps {
  title: string
  subtitle?: string
  points: ChartSeriesPoint[]
  valueFormat?: UiChartAreaValueFormat
  emptyLabel: string
  accentClass?: string
}
