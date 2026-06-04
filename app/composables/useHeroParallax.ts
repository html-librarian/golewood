export const useHeroParallax = (sectionRef: Ref<HTMLElement | null>) => {
  const meshOffset = ref(0)
  const orbOffset = ref(0)

  let rafId = 0

  onMounted(() => {
    const section = sectionRef.value

    if (!section || !import.meta.client) {
      return
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      return
    }

    const update = () => {
      rafId = 0
      const rect = section.getBoundingClientRect()
      const progress = Math.min(Math.max(-rect.top / Math.max(rect.height, 1), 0), 1)

      meshOffset.value = progress * 22
      orbOffset.value = progress * 36
    }

    const onScroll = () => {
      if (rafId) {
        return
      }

      rafId = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(rafId)
    })
  })

  const meshStyle = computed(() => ({
    transform: `translateY(${meshOffset.value}px)`,
  }))

  const orbStyle = computed(() => ({
    transform: `translateY(${orbOffset.value}px)`,
  }))

  const orbStyleSlow = computed(() => ({
    transform: `translateY(${orbOffset.value * 0.65}px)`,
  }))

  return { meshStyle, orbStyle, orbStyleSlow }
}
