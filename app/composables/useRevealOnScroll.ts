export interface UseRevealOnScrollOptions {
  threshold?: number
  rootMargin?: string
}

export const useRevealOnScroll = (
  target: Ref<HTMLElement | null>,
  options: UseRevealOnScrollOptions = {},
) => {
  const isRevealed = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const el = target.value

    if (!el || !import.meta.client) {
      return
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      isRevealed.value = true
      el.classList.add('is-revealed')
      return
    }

    el.classList.add('reveal-section--animate')

    const revealIfVisible = () => {
      const rect = el.getBoundingClientRect()

      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        isRevealed.value = true
        el.classList.add('is-revealed')
        observer?.disconnect()
        return true
      }

      return false
    }

    if (revealIfVisible()) {
      return
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          isRevealed.value = true
          el.classList.add('is-revealed')
          observer?.disconnect()
        }
      },
      {
        threshold: options.threshold ?? 0.08,
        rootMargin: options.rootMargin ?? '0px 0px -6% 0px',
      },
    )

    observer.observe(el)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
  })

  return { isRevealed }
}
