import { describe, expect, it } from 'vitest'
import { lastNDaysKeys, mergeDailySeries } from '#shared/utils/chart-buckets'

describe('chart-buckets', () => {
  it('mergeDailySeries fills missing days with zero', () => {
    const keys = ['2026-05-01', '2026-05-02', '2026-05-03']
    const merged = mergeDailySeries(keys, [{ date: '2026-05-02', value: 4 }])

    expect(merged).toEqual([
      { date: '2026-05-01', value: 0 },
      { date: '2026-05-02', value: 4 },
      { date: '2026-05-03', value: 0 },
    ])
  })

  it('lastNDaysKeys returns requested length', () => {
    expect(lastNDaysKeys(7)).toHaveLength(7)
  })
})
