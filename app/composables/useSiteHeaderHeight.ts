const SITE_HEADER_HEIGHT_VAR = '--site-header-height'

export const useSiteHeaderHeight = () => {
  const headerRef = ref<HTMLElement | null>(null)
  let resizeObserver: ResizeObserver | undefined

  const syncHeaderHeight = () => {
    if (!import.meta.client || !headerRef.value) {
      return
    }

    const height = Math.ceil(headerRef.value.getBoundingClientRect().height)
    document.documentElement.style.setProperty(SITE_HEADER_HEIGHT_VAR, `${height}px`)
  }

  onMounted(() => {
    syncHeaderHeight()

    if (headerRef.value) {
      resizeObserver = new ResizeObserver(syncHeaderHeight)
      resizeObserver.observe(headerRef.value)
    }

    window.addEventListener('resize', syncHeaderHeight, { passive: true })
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    window.removeEventListener('resize', syncHeaderHeight)
  })

  return {
    headerRef,
    syncHeaderHeight,
  }
}
