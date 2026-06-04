import type { ListingSectionNavItem } from '~/components/listing/section-nav/types'

const SECTION_NAV_HEIGHT_PX = 49
const SCROLL_SPY_TOLERANCE_PX = 8
const BOTTOM_SNAP_PX = 48

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

  let scrollRaf = 0
  let scrollHandler: (() => void) | undefined

  const getScrollAnchorPx = () =>
    getSiteHeaderOffsetPx() + (visible.value ? SECTION_NAV_HEIGHT_PX : 0)

  const updateVisible = () => {
    const el = triggerRef.value

    if (!el) {
      visible.value = false
      return
    }

    visible.value = el.getBoundingClientRect().bottom < getSiteHeaderOffsetPx()
  }

  const updateActiveSection = () => {
    const list = items.value

    if (!list.length) {
      return
    }

    const nearBottom = window.innerHeight + window.scrollY
      >= document.documentElement.scrollHeight - BOTTOM_SNAP_PX

    if (nearBottom) {
      activeId.value = list[list.length - 1].id
      return
    }

    const anchor = getScrollAnchorPx() + SCROLL_SPY_TOLERANCE_PX
    let nextActive = list[0].id

    for (const item of list) {
      const element = document.getElementById(item.id)

      if (!element) {
        continue
      }

      if (element.getBoundingClientRect().top <= anchor) {
        nextActive = item.id
      }
    }

    activeId.value = nextActive
  }

  const onScroll = () => {
    if (scrollRaf) {
      return
    }

    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0
      updateVisible()
      updateActiveSection()
    })
  }

  watch(items, () => nextTick(() => updateActiveSection()), { deep: true })

  watch(visible, () => nextTick(() => updateActiveSection()))

  onMounted(() => {
    scrollHandler = onScroll
    window.addEventListener('scroll', scrollHandler, { passive: true })
    window.addEventListener('resize', scrollHandler, { passive: true })
    updateVisible()
    updateActiveSection()
  })

  onBeforeUnmount(() => {
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler)
      window.removeEventListener('resize', scrollHandler)
    }

    if (scrollRaf) {
      cancelAnimationFrame(scrollRaf)
    }
  })

  return {
    visible,
    activeId,
    scrollToSection,
  }
}
