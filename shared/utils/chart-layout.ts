export const CHART_WIDTH = 640
export const CHART_HEIGHT = 200
export const CHART_SVG_CLASS = 'h-52 w-full touch-none md:h-60'
export const CHART_PAD = { top: 20, right: 16, bottom: 36, left: 48 } as const

export const niceCeil = (value: number) => {
  if (value <= 0) {
    return 1
  }

  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const nice = normalized <= 1
    ? 1
    : normalized <= 2
      ? 2
      : normalized <= 5
        ? 5
        : 10

  return nice * magnitude
}

/**
 * Верх шкалы Y: делится на `segments` равных шагов без «кривых» подписей
 * (например, при max=6 → 0…8 с шагом 2, а не 0,3,5,8,10).
 */
export const chartAxisMax = (maxValue: number, segments = 4) => {
  if (maxValue <= 0) {
    return segments
  }

  const step = Math.max(1, Math.ceil(maxValue / segments))
  return step * segments
}

/** Равномерные деления оси Y от 0 до chartAxisMax (линейная шкала). */
export const buildYAxisTicks = (maxValue: number, segments = 4) => {
  const top = chartAxisMax(maxValue, segments)
  const step = top / segments

  return Array.from({ length: segments + 1 }, (_, index) => top - index * step)
}

/** Прямые отрезки между точками — для счётчиков и редких всплесков. */
export const buildLinearPath = (coords: { x: number, y: number }[]) => {
  if (!coords.length) {
    return ''
  }

  return coords
    .map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x} ${coord.y}`)
    .join(' ')
}

/** Индексы дней для подписей по оси X (без наложения). */
export const pickXLabelIndices = (length: number, maxLabels = 7) => {
  if (length <= 0) {
    return []
  }

  if (length <= maxLabels) {
    return Array.from({ length }, (_, index) => index)
  }

  const indices = new Set<number>([0, length - 1])
  const step = (length - 1) / (maxLabels - 1)

  for (let i = 1; i < maxLabels - 1; i += 1) {
    indices.add(Math.round(i * step))
  }

  return [...indices].sort((a, b) => a - b)
}

/** Сглаженная линия (монотонный сплайн через точки). */
export const buildSmoothPath = (coords: { x: number, y: number }[]) => {
  if (!coords.length) {
    return ''
  }

  if (coords.length === 1) {
    return `M ${coords[0].x} ${coords[0].y}`
  }

  let path = `M ${coords[0].x} ${coords[0].y}`

  for (let i = 0; i < coords.length - 1; i += 1) {
    const p0 = coords[Math.max(i - 1, 0)]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[Math.min(i + 2, coords.length - 1)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }

  return path
}

export const indexFromChartX = (
  clientX: number,
  rect: DOMRect,
  pointCount: number,
  padLeft: number,
  padRight: number,
  chartWidth: number,
) => {
  if (pointCount <= 1) {
    return 0
  }

  const innerW = chartWidth - padLeft - padRight
  const relativeX = ((clientX - rect.left) / rect.width) * chartWidth - padLeft
  const ratio = Math.min(1, Math.max(0, relativeX / innerW))

  return Math.round(ratio * (pointCount - 1))
}
