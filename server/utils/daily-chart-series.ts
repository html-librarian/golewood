import { mergeDailySeries, lastNDaysKeys } from '#shared/utils/chart-buckets'
import { CHART_PERIOD_DAYS } from '#shared/types/chart'
import type { ChartSeriesPoint } from '#shared/types/chart'
import type { SQL } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export const dayBucket = (column: SQL | unknown) =>
  sql<string>`to_char(date_trunc('day', ${column}), 'YYYY-MM-DD')`

export const toDailyChartSeries = (
  rows: { date: string, value: number }[],
  days = CHART_PERIOD_DAYS,
): ChartSeriesPoint[] => mergeDailySeries(lastNDaysKeys(days), rows)
