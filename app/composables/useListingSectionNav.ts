import type { ListingSectionNavItem } from '~/components/listing/section-nav/types'

const getSiteHeaderOffsetPx = () => {
  if (!import.meta.client) {
    return 64
  }

  const raw = getComputedStyle(document.documentElement).getPropertyValue('--site-header-height')
  const parsed = Number.parseFloat(raw)

  return Number.isFinite(parsed) ? parsed : 64
}

export const useListingSectionNav = (
  items: Ref<ListingSectionNavItem[]>,
  triggerRef: Ref<HTMLElement | null | undefined>,
) => {
  const visible = ref(false)
  const activeId = ref('')

  watch(
    items,
    (list) => {
      if (!list.length) {
        return
      }

      if (!list.some(item => item.id === activeId.value)) {
        activeId.value = list[0].id
      }
    },
    { immediate: true },
  )

  const scrollToSection = (id: string) => {
    activeId.value = id
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  let sectionObserver: IntersectionObserver | undefined
  let scrollHandler: (() => void) | undefined

  const updateVisible = () => {
    const el = triggerRef.value

    if (!el) {
      visible.value = false
      return
    }

    visible.value = el.getBoundingClientRect().bottom < getSiteHeaderOffsetPx()
  }

  const bindSectionObserver = () => {
    sectionObserver?.disconnect()

    if (!import.meta.client) {
      return
    }

    const elements = items.value
      .map(item => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null)

    if (!elements.length) {
      return
    }

    sectionObserver = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (intersecting[0]?.target.id) {
          activeId.value = intersecting[0].target.id
        }
      },
      {
        rootMargin: '-96px 0px -55% 0px',
        threshold: [0, 0.1, 0.25, 0.5],
      },
    )

    for (const element of elements) {
      sectionObserver.observe(element)
    }
  }

  watch(items, () => nextTick(() => bindSectionObserver()), { deep: true })

  onMounted(() => {
    scrollHandler = () => updateVisible()
    window.addEventListener('scroll', scrollHandler, { passive: true })
    window.addEventListener('resize', scrollHandler, { passive: true })
    updateVisible()
    nextTick(() => bindSectionObserver())
  })

  onBeforeUnmount(() => {
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler)
      window.removeEventListener('resize', scrollHandler)
    }

    sectionObserver?.disconnect()
  })

  return {
    visible,
    activeId,
    scrollToSection,
  }
}
