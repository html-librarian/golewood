export interface HostStatsChartSegment {
  label: string
  value: number
  color: string
}

export interface HostStatsChartProps {
  title: string
  segments: HostStatsChartSegment[]
  totalLabel?: string
}
