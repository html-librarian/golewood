export interface UseCountUpOptions {
  duration?: number
  decimals?: number
}

export const useCountUp = (
  target: Ref<number | null | undefined>,
  options: UseCountUpOptions = {},
) => {
  const duration = options.duration ?? 700
  const decimals = options.decimals ?? 1

  const display = ref<number | null>(null)
  let frameId = 0

  const prefersReducedMotion = () =>
    import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const animateTo = (value: number) => {
    if (prefersReducedMotion()) {
      display.value = value
      return
    }

    cancelAnimationFrame(frameId)
    const start = performance.now()
    const from = display.value ?? 0

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      const current = from + (value - from) * eased
      display.value = Math.round(current * 10 ** decimals) / 10 ** decimals

      if (progress < 1) {
        frameId = requestAnimationFrame(step)
      }
    }

    frameId = requestAnimationFrame(step)
  }

  watch(target, (value) => {
    if (value === null || value === undefined) {
      display.value = null
      return
    }

    animateTo(value)
  }, { immediate: true })

  onBeforeUnmount(() => {
    cancelAnimationFrame(frameId)
  })

  return { display }
}
