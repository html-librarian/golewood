/** Точка временного ряда (день, ISO YYYY-MM-DD). */
export type ChartSeriesPoint = {
  date: string
  value: number
}

export type ChartSegment = {
  label: string
  value: number
  color: string
}

export const CHART_PERIOD_DAYS = 30
