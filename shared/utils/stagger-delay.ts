export const staggerDelayMs = (index: number, step = 55, max = 385) =>
  Math.min(Math.max(index, 0) * step, max)
