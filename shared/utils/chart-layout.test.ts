import { describe, expect, it } from 'vitest'
import { buildYAxisTicks, chartAxisMax, niceCeil, pickXLabelIndices } from './chart-layout'

describe('chart-layout', () => {
  it('niceCeil rounds up to readable steps', () => {
    expect(niceCeil(21)).toBeGreaterThanOrEqual(21)
    expect(niceCeil(0)).toBe(1)
  })

  it('buildYAxisTicks includes zero', () => {
    expect(buildYAxisTicks(21).at(-1)).toBe(0)
  })

  it('buildYAxisTicks uses equal steps for sparse counts', () => {
    expect(chartAxisMax(6)).toBe(8)
    expect(buildYAxisTicks(6)).toEqual([8, 6, 4, 2, 0])
  })

  it('pickXLabelIndices covers first and last', () => {
    const indices = pickXLabelIndices(30, 7)
    expect(indices[0]).toBe(0)
    expect(indices.at(-1)).toBe(29)
    expect(indices.length).toBeGreaterThan(3)
  })
})
