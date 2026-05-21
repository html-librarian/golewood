import type { ChartSeriesPoint } from '#shared/types/chart'

export type UiChartStackedBarSeries = {
  label: string
  color: string
  points: ChartSeriesPoint[]
}

export interface UiChartStackedBarProps {
  title: string
  subtitle?: string
  series: UiChartStackedBarSeries[]
  valueFormat?: 'count' | 'price'
  emptyLabel: string
}
