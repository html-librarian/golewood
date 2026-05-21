import { CHART_PERIOD_DAYS } from '#shared/types/chart'
import type { ChartSeriesPoint } from '#shared/types/chart'

/** Ключи последних N календарных дней (включая сегодня), UTC-дата. */
export const lastNDaysKeys = (days = CHART_PERIOD_DAYS): string[] => {
  const keys: string[] = []
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - offset)
    keys.push(day.toISOString().slice(0, 10))
  }

  return keys
}

export const chartPeriodStart = (days = CHART_PERIOD_DAYS) => {
  const keys = lastNDaysKeys(days)
  const start = new Date(`${keys[0]}T00:00:00.000Z`)
  return start
}

export const mergeDailySeries = (
  dayKeys: string[],
  rows: { date: string, value: number }[],
): ChartSeriesPoint[] => {
  const map = new Map(rows.map(row => [row.date, row.value]))

  return dayKeys.map(date => ({
    date,
    value: map.get(date) ?? 0,
  }))
}

export const sumSeries = (points: ChartSeriesPoint[]) =>
  points.reduce((sum, point) => sum + point.value, 0)

export const maxSeriesValue = (points: ChartSeriesPoint[]) =>
  Math.max(0, ...points.map(point => point.value))
